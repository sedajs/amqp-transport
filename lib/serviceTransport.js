'use strict';

const debug = require('debug')('amqptransport:servicetransport');

module.exports = function injectToServiceTransport() {
  function AMQPServiceTransport(channel, serviceName, exchangeName) {
    debug('Created for service ' +  serviceName + ' using exchange ' + exchangeName);
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
    debug('Asserting main queue');
    const queueInfo = await this._channel.assertQueue(this.serviceName, { durable: false });
    this._queueName = queueInfo.queue;

    debug('Asserting replies queue');
    const randomSlug = Math.random().toString(36).substr(2,25);
    const replyQueueName = this.serviceName + '_replies_' + randomSlug;
    const replyQueueInfo = await this._channel.assertQueue(replyQueueName, { durable: false, autoDelete: true });
    this._replyQueueName = replyQueueInfo.queue;

    debug('Binding replies queue');
    const bindedReplyDispatch = this._dispatchReply.bind(this);
    await this._channel.consume(this._replyQueueName, bindedReplyDispatch);
  };

  proto.start = async function() {
    debug('Binding ' + this.serviceName + ' main queue');
    const bindedDispatch = this._dispatch.bind(this);
    await this._channel.consume(this.serviceName, bindedDispatch);
  };

  proto.addListener = async function addListener(eventName, handler) {
    debug('Adding listiner for ' + eventName);
    if (!this._handlers[eventName]) this._handlers[eventName] = [];
    const handlers = this._handlers[eventName];
    if (handlers.includes(handler)) return;
    handlers.push(handler);

    this._channel.bindQueue(this._queueName, this._exchangeName, eventName);
  };

  proto._dispatch = async function(rawReceivedEvent) {
    const event = JSON.parse(rawReceivedEvent.content.toString());
    const eventName = event.metadata.name;
    debug('Dispatching received event ' + eventName);
    const handlers = this._handlers[eventName];

    if (!handlers || handlers.length === 0) {
      debug('Warning: No handlers for ' + eventName + '!!');
      this._channel.nack(rawReceivedEvent);
      return;
    }

    for (let i=0; i<handlers.length; i++) {
      debug('Invoking handler #' + i + ' for ' + eventName);
      let handler = handlers[i];
      await handler(null, event);
    }

    this._channel.ack(rawReceivedEvent);
  };

  proto._dispatchReply = async function(rawReceivedReplyEvent) {
    this._channel.ack(rawReceivedReplyEvent);

    const event = JSON.parse(rawReceivedReplyEvent.content.toString());
    const replyTag = event.metadata.replies.tag;
    debug('Dispatching received reply for ' + replyTag);
    const handler = this._replyHandler[replyTag];

    if (!handler) {
      debug('Warning: Reply ' + replyTag + ' have no associated handler');
      return;
    }

    await handler(null, event);
    delete this._replyHandler[replyTag];
  };


  proto._send = async function send(event) {
    const text = JSON.stringify(event);
    const rawEventContent = Buffer.from(text);
    if (event.metadata.replies) {
      const replyQueue = event.metadata.replies.queue;
      debug('Sending reply to ' + replyQueue + '. Content: ' + text);
      await this._channel.sendToQueue(replyQueue, rawEventContent);
    } else {
      debug('Publishing ' + event.metadata.name + ' event. Content: ' + text);
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
