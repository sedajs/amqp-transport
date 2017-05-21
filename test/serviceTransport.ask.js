'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#ask()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  const fakeChannel = {};
  let instance;
  let context = {};
  beforeEach(() => {
    context = {
      _replyQueueName: 'barfoo',
      _replyHandler: {},
      _send: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  const eventName = 'foo';
  const handler = function() {};

  it('should return a promise', function() {
    let value = instance.ask();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should register the reply handler', async function() {
    const handlerStub = sinon.stub();
    const event = {
      metadata: {},
      body: {}
    };

    await instance.ask.call(context, event, handlerStub);

    assert.strictEqual(Object.keys(context._replyHandler).length, 1);
  });

  it('should call _send with the provided event', async function() {
    const handlerStub = sinon.stub();
    const event = {
      metadata: {},
      body: {}
    };

    const stub = context._send;

    await instance.ask.call(context, event, handlerStub);

    assert.ok(stub.called, '_send not called');
    assert.ok(stub.calledOnce, '_send called more than once');
  });

  it('should add replyTo object to metadata', async function() {
    const handlerStub = sinon.stub();
    const event = {
      metadata: {},
      body: {}
    };

    const stub = context._send;

    await instance.ask.call(context, event, handlerStub);
    const outputEvent = context._send.getCall(0).args[0];

    const replyTo = outputEvent.metadata.replyTo;
    assert.ok(replyTo, 'replyTo not found');
    assert.strictEqual(replyTo.queue, context._replyQueueName, 'replyTo queue differs from reply queue name');
    assert.ok(outputEvent.metadata.replyTo.tag, 'replyTo tag property not found');
  });
});
