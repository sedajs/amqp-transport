'use strict';

module.exports = function injectToServiceTransport() {
  function AMQPServiceTransport(channel, serviceName, exchangeName) {
    if (!channel) throw new Error('Missing channel in AMQPServiceTransport constructor');
    this._channel = channel;

    if (!serviceName) throw new Error('Missing service name in AMQPServiceTransport constructor');
    this.serviceName = serviceName;

    if (!exchangeName) throw new Error('Missing exchange name in AMQPServiceTransport constructor');
    this._exchangeName = exchangeName;

    this._handlers = {};
    this._replyHandler = {};
  }
  const proto = AMQPServiceTransport.prototype;

  proto.prepare = async function prepare() {
    const queueInfo = await this._channel.assertQueue(this.serviceName, { durable: false });
    this._queueName = queueInfo.queue;

    const randomSlug = Math.random().toString(36).substr(2,25);
    const replyQueueName = this.serviceName + '_replies_' + randomSlug;
    const replyQueueInfo = await this._channel.assertQueue(replyQueueName, { durable: false, autoDelete: true });
    this._replyQueueName = replyQueueInfo.queue;

    const bindedReplyDispatch = this._dispatchReply.bind(this);
    await this._channel.consume(this._replyQueueName, bindedReplyDispatch);
  };

  proto.start = async function() {
    const bindedDispatch = this._dispatch.bind(this);
    await this._channel.consume(this.serviceName, bindedDispatch);
  };

  proto.addListener = async function addListener(eventName, handler) {
    if (!this._handlers[eventName]) this._handlers[eventName] = [];
    const handlers = this._handlers[eventName];
    if (handlers.includes(handler)) return;
    handlers.push(handler);

    this._channel.bindQueue(this._queueName, this._exchangeName, eventName);
  };

  proto._dispatch = async function(rawReceivedEvent) {
    const event = JSON.parse(rawReceivedEvent.content.toString());
    const eventName = event.metadata.name;
    const handlers = this._handlers[eventName];

    if (!handlers || handlers.length === 0) {
      this._channel.nack(rawReceivedEvent);
      return;
    }

    for (let i=0; i<handlers.length; i++) {
      let handler = handlers[i];
      await handler(null, event);
    };

    this._channel.ack(rawReceivedEvent);
  };

  proto._dispatchReply = async function(rawReceivedReplyEvent) {
    this._channel.ack(rawReceivedReplyEvent);

    const event = JSON.parse(rawReceivedReplyEvent.content.toString());
    const replyTag = event.metadata.replies.tag;
    const handler = this._replyHandler[replyTag];

    if (!handler) return;

    await handler(null, event);
    delete this._replyHandler[replyTag];
  };


  proto._send = async function send(event) {
    const rawEventContent = Buffer.from(JSON.stringify(event));
    if (event.metadata.replies) {
      await this._channel.sendToQueue(event.metadata.replies.queue, rawEventContent);
    } else {
      await this._channel.publish(this._exchangeName, event.metadata.name, rawEventContent);
    }
  };

  proto.ask = async function ask(event, handler) {
    let randomReplyTag;
    do {
      randomReplyTag = Math.random().toString(36).substr(2,25);
    } while (this._replyHandler[randomReplyTag]);

    event.metadata.replyTo = {
      queue: this._replyQueueName,
      tag: randomReplyTag
    };
    this._replyHandler[randomReplyTag] = handler;

    await this._send(event);
  };

  proto.reply = async function reply(incomingEvent, replyEvent) {
    replyEvent.metadata.replies = {
      queue: incomingEvent.metadata.replyTo.queue,
      tag: incomingEvent.metadata.replyTo.tag
    };

    this._send(replyEvent);
  };

  proto.publish = async function publish(event) {
    await this._send(event);
  };

  return AMQPServiceTransport;
};
