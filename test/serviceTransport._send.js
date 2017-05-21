'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#_send()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  let instance;
  let fakeChannel = {};
  beforeEach(() => {
    fakeChannel = {
      publish: sinon.stub().resolves(),
      sendToQueue: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  const eventName = 'foo';
  const handler = function() {};

  it('should return a promise', function() {
    let value = instance._send();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should call channel.publish if the event is not a reply', async function() {
    const event = {
      metadata: {
        name: serviceName + '.test',
      },
      body: {}
    };

    await instance._send(event);

    assert.ok(fakeChannel.publish.called, 'Not called');
    assert.ok(fakeChannel.publish.calledOnce, 'Called more than once');
    const args = fakeChannel.publish.getCall(0).args;
    assert.strictEqual(args[0], exchangeName, 'channel.publish first argument is not the exchange');
    assert.strictEqual(args[1], event.metadata.name, 'channel.publish second argument is not the event name');
    assert.ok(args[2] instanceof Buffer, 'channel.publish third argument is not a buffer');
  });

  it('should call channel.sendToQueue if the event is a reply', async function() {
    const event = {
      metadata: {
        replies: {
          queue: 'foobar',
          tag: 'barfoo'
        }
      },
      body: {}
    };

    await instance._send(event);

    assert.ok(fakeChannel.sendToQueue.called, 'Not called');
    assert.ok(fakeChannel.sendToQueue.calledOnce, 'Called more than once');
    const args = fakeChannel.sendToQueue.getCall(0).args;
    assert.strictEqual(args[0], event.metadata.replies.queue, 'channel.publish first argument is not the reply queue name');
    assert.ok(args[1] instanceof Buffer, 'channel.publish third argument is not a buffer');
  });
});
