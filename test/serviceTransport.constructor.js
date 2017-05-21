'use strict';

const ServiceTransport = require('../lib').ServiceTransport;
const assert = require('assert');

const validName = 'foo';
const exchangeName = 'bar';
const fakeChannel = {};

describe('ServiceTransport constructor', function() {
  it('should fail if no channel provided', function() {
    assert.throws(() => {
      const instance = new ServiceTransport();
    }, /Missing channel in AMQPServiceTransport constructor/);
  });

  it('should fail if no name provided', function() {
    assert.throws(() => {
      const instance = new ServiceTransport(fakeChannel);
    }, /Missing service name in AMQPServiceTransport constructor/);
  });

  it('should fail if no exchange name provided', function() {
    assert.throws(() => {
      const instance = new ServiceTransport(fakeChannel, validName);
    }, /Missing exchange name in AMQPServiceTransport constructor/);
  });

  it('should be instantiable', function() {
    const instance = new ServiceTransport(fakeChannel, validName, exchangeName);
    assert.ok(instance instanceof ServiceTransport);
  });

  it('should assign the name to serviceName property', function() {
    const instance = new ServiceTransport(fakeChannel, validName, exchangeName);
    assert.strictEqual(validName, instance.serviceName, 'serviceName property differs');
  });

  it('should assign the channel to _channel property', function() {
    const instance = new ServiceTransport(fakeChannel, validName, exchangeName);
    assert.strictEqual(fakeChannel, instance._channel, '_channel property differs');
  });

  it('should assign the exchange name to _exchangeName property', function() {
    const instance = new ServiceTransport(fakeChannel, validName, exchangeName);
    assert.strictEqual(exchangeName, instance._exchangeName, '_exchangeName property differs');
  });

  it('should create an empty _handlers object', function() {
    const instance = new ServiceTransport(fakeChannel, validName, exchangeName);
    assert.ok(instance._handlers, '_handlers does not exists');
    const nItems = Object.keys(instance._handlers).length;
    assert.strictEqual(nItems, 0, '_handlers is not empty');
  });

  it('should create an empty _replyHandler object', function() {
    const instance = new ServiceTransport(fakeChannel, validName, exchangeName);
    assert.ok(instance._replyHandler, '_replyHandler does not exists');
    const nItems = Object.keys(instance._replyHandler).length;
    assert.strictEqual(nItems, 0, '_replyHandler is not empty');
  });
});
