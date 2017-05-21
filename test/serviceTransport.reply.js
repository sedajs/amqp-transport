'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#reply()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  let instance;
  let fakeChannel = {};
  beforeEach(() => {
    fakeChannel = {};
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  const eventName = 'foo';
  const handler = function() {};

  it('should return a promise', function() {
    let value = instance.reply();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should call _send with the provided event', async function() {
    const incomingEvent = {
      metadata: {
        name: serviceName + '.test',
        replyTo: {
          queue: 'foo.replyQueue12312321',
          tag: 'alsdf123123.123sdf'
        }
      },
      payload: {}
    };

    const event = {
      metadata: {},
      payload: {
        success: true
      }
    }

    const stub = sinon.stub().resolves();
    const context = {
      _send: stub
    };
    await instance.reply.call(context, incomingEvent, event);

    assert.ok(stub.called, '_send not called');
    assert.ok(stub.calledOnce, '_send called more than once');
    const outputEvent = stub.getCall(0).args[0];
    assert.ok(outputEvent.metadata.replies, 'replies metadata not found');
    assert.strictEqual(outputEvent.metadata.replies.queue, incomingEvent.metadata.replyTo.queue, 'reply queue differs from provided');
    assert.strictEqual(outputEvent.metadata.replies.tag, incomingEvent.metadata.replyTo.tag, 'reply tag differs from provided');
  });
});
