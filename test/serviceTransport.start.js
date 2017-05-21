'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#start()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  let fakeChannel;
  let instance;
  beforeEach(() => {
    fakeChannel = {
      consume: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  it('should return a promise', function() {
    const value = instance.start();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should tell amqp start receiving messages with _dispatch handler', async function() {
    await instance.start();

    const stub = fakeChannel.consume;
    assert.ok(stub.called, 'amqplib consume method not called');
    assert.ok(stub.calledOnce, 'amqplib consume method called more than once');
    const args = stub.getCall(0).args;
    assert.strictEqual(args[0], serviceName, 'listening a queue not called as service name');
  });
});
