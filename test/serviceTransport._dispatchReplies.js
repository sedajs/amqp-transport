'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#_dispatchReply()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  const replyTag = 'asd123';
  let instance;
  let fakeChannel = {};
  let receivedEvent = {};
  let rawReceivedEvent = {};
  beforeEach(() => {
    fakeChannel = {
      ack: sinon.stub().resolves(),
      nack: sinon.stub().resolves()
    };

    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);

    receivedEvent = {
      metadata: {
        replies: {
          queue: 'barfoo',
          tag: replyTag
        }
      },
      payload: {
        success: true
      }
    };

    rawReceivedEvent = {
      content: Buffer.from(JSON.stringify(receivedEvent)),
      fields: {
        routingKey: instance._replyQueueName
      },
      properties: {}
    };

  });

  it('should exists', function() {
    assert.ok(instance._dispatchReply, 'Does not exists');
    assert.strictEqual(typeof instance._dispatchReply, 'function', 'It is not a function');
  });

  it('should call the associated asynchronous function', async function() {
    const eventHandler = sinon.stub().resolves();
    instance._replyHandler[replyTag] = eventHandler;

    await instance._dispatchReply(rawReceivedEvent);
    assert.ok(eventHandler.called, 'Handler not called');
    assert.ok(eventHandler.calledOnce, 'Handler called more than once');
    const firstParam = eventHandler.getCall(0).args[1];
    assert.strictEqual(JSON.stringify(firstParam.payload), JSON.stringify(receivedEvent.payload), 'Content differs');
  });

  it('should ack the event', async function() {
    const eventHandler = sinon.stub().resolves();

    instance._replyHandler[replyTag] = eventHandler;

    await instance._dispatchReply(rawReceivedEvent);
    assert.ok(fakeChannel.ack.called, 'Event not acked');
    assert.ok(fakeChannel.ack.calledOnce, 'Event acked more than one time');
    const firstParam = fakeChannel.ack.getCall(0).args[0];
    assert.strictEqual(firstParam, rawReceivedEvent, 'Acked something different than the raw event');
  });

  it('should delete the listening handler after it ends', async function() {
    const eventHandler = sinon.stub().resolves();
    instance._replyHandler[replyTag] = eventHandler;

    await instance._dispatchReply(rawReceivedEvent);
    assert.strictEqual(instance._replyHandler[replyTag], undefined, 'Handler not removed');
  });

  it('should do nothing if there is no associated handler', async function() {
    const randomReplyTag = Math.random().toString(36).substr(0,20);

    await instance._dispatchReply(rawReceivedEvent);
  });
});
