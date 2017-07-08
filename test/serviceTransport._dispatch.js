'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#_dispatch()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  const eventName = 'foo.morefoo';
  const payload = { success : true };
  let instance;
  let fakeChannel;
  let receivedEvent;
  let rawReceivedEvent;
  beforeEach(() => {
    fakeChannel = {
      ack: sinon.stub().resolves(),
      nack: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);

    receivedEvent = {
      metadata: {
        name: eventName
      },
      payload
    };

    rawReceivedEvent = {
      content: Buffer.from(JSON.stringify(receivedEvent)),
      fields: {
        routingKey: eventName
      },
      properties: {}
    }
  });

  it('should exists', function() {
    assert.ok(instance._dispatch, 'Does not exists');
    assert.strictEqual(typeof instance._dispatch, 'function', 'It is not a function');
  });

  it('should call the associated asynchronous functions', async function() {
    const eventHandler = sinon.stub().resolves();
    instance._handlers[eventName] = [ eventHandler ];

    await instance._dispatch(rawReceivedEvent);
    assert.ok(eventHandler.called, 'Handler not called');
    assert.ok(eventHandler.calledOnce, 'Handler called more than once');
    const firstParam = eventHandler.getCall(0).args[1];
    assert.strictEqual(JSON.stringify(firstParam.payload), JSON.stringify(receivedEvent.payload), 'Content differs');
  });

  it('should ack the event if it is handled', async function() {
    const eventHandler = sinon.stub().resolves();
    instance._handlers[eventName] = [ eventHandler ];

    await instance._dispatch(rawReceivedEvent);
    assert.ok(fakeChannel.ack.called, 'Event not acked');
    assert.ok(fakeChannel.ack.calledOnce, 'Event acked more than one time');
    const firstParam = fakeChannel.ack.getCall(0).args[0];
    assert.strictEqual(firstParam, rawReceivedEvent, 'Acked something different than the raw event');
  });

  it('should nack the event if there is no associated handler available', async function() {
    await instance._dispatch(rawReceivedEvent);
    assert.ok(fakeChannel.nack.called, 'Event not nacked');
    assert.ok(fakeChannel.nack.calledOnce, 'Event nacked more than one time');
    const firstParam = fakeChannel.nack.getCall(0).args[0];
    assert.strictEqual(firstParam, rawReceivedEvent, 'Nacked something different than the raw event');
  });
});
