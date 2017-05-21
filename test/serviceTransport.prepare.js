'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#prepare()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  let fakeChannel;
  let fakeQueue = {};
  let instance;
  beforeEach(() => {
    fakeChannel = {
      assertQueue: sinon.stub().resolves({ queue: serviceName }),
      consume: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  it('should return a promise', function() {
    const value = instance.prepare();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should assert the queue existence and asign to _queue property', async function() {
    await instance.prepare();
    const stub = fakeChannel.assertQueue;
    assert.ok(stub.called, 'assertQueue not called');
    const args = stub.getCall(0).args;
    assert.strictEqual(args[0], serviceName, 'queue name and service name differs');
    assert.strictEqual(instance._queueName, serviceName, '_queueName not assigned');
  });

  it('should assert the reply queue existence and assign to _replyQueue property', async function() {
    await instance.prepare();
    const stub = fakeChannel.assertQueue;
    assert.ok(stub.called, 'assertQueue not called');
    const args = stub.getCall(1).args;
    const formatRegex = /foo_replies_(\d|\w)+/;
    assert.ok(formatRegex.test(args[0]), 'Reply queue name format differs');
  });

  it('should use amqplib consume to start listening for replies', async function() {
    await instance.prepare();

    const stub = fakeChannel.consume;
    assert.ok(stub.called, 'amqplib consume method not called');
    assert.ok(stub.calledOnce, 'amqplib consume method called more than once');
    const args = stub.getCall(0).args;
    assert.strictEqual(args[0], instance._replyQueueName, 'listening a queue not called as service name');
  });
});
