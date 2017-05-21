'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#publish()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  const fakeChannel = {};
  let instance;
  let context = {};
  beforeEach(() => {
    context = {
      _send: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  const eventName = 'foo';
  const handler = function() {};

  it('should return a promise', function() {
    let value = instance.publish();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should call _send with the provided event', async function() {
    const handlerStub = sinon.stub();
    const event = {
      metadata: {},
      body: {}
    };

    const stub = context._send;

    await instance.publish.call(context, event, handlerStub);

    assert.ok(stub.called, '_send not called');
    assert.ok(stub.calledOnce, '_send called more than once');
  });
});
