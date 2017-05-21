'use strict';

const assert = require('assert');
const sinon = require('sinon');

const ServiceTransport = require('../lib').ServiceTransport;
const injectToServiceTransport = require('../lib/serviceTransport');

describe('AMQPServiceTransport#addListener()', function() {
  const serviceName = 'foo';
  const exchangeName = 'bar';
  let instance;
  let fakeChannel = {};
  beforeEach(() => {
    fakeChannel = {
      bindQueue: sinon.stub().resolves()
    };
    instance = new ServiceTransport(fakeChannel, serviceName, exchangeName);
  });

  const eventName = 'foo';
  const handler = function() {};

  it('should return a promise', function() {
    let value = instance.addListener();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should register the handler when it is not already associated with the event name', async function() {
    await instance.addListener(eventName, handler);
    const handlers = instance._handlers;
    const nKeys = Object.keys(handlers).length;
    assert.strictEqual(nKeys, 1, 'The number of listening events is not one');
    assert.strictEqual(handlers[eventName].length, 1, 'The number of handlers for the event is not one');
    assert.strictEqual(handlers[eventName][0], handler, 'The handler is not the provided one');
  });

  it('should do nothing when the handler is already associated with the event name', async function() {
    const handlers = instance._handlers;
    handlers[eventName] = [ handler ];

    await instance.addListener(eventName, handler);
    const nKeys = Object.keys(handlers).length;
    assert.strictEqual(nKeys, 1, 'The number of listening events is not one');
    assert.strictEqual(handlers[eventName].length, 1, 'The number of handlers for the event is not one');
    assert.strictEqual(handlers[eventName][0], handler, 'The handler is not the provided one');
  });

  it('should bind the event name as routing key to the queue', async function() {
    await instance.addListener(eventName, handler);
    assert.ok(fakeChannel.bindQueue.called, 'bindQueue not called');
    assert.ok(fakeChannel.bindQueue.calledOnce, 'bindQueue called more than once');
  });
});
