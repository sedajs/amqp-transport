'use strict';

const Transport = require('../lib').Transport;
const injectToTransport = require('../lib/transport');

const assert = require('assert');
const sinon = require('sinon');

const connectionURI = 'asd';
let instance;
beforeEach(() => {
  instance = new Transport(connectionURI);
});

describe('AMQPTransport#start()', function() {
  it('should return a promise', function() {
    const returnedValue = instance.start()
    assert.ok(returnedValue instanceof Promise, 'Not a promise');
    // Ignore unrelated errors
    returnedValue.catch(() => {});
  });

  it('should use provided uri to connect to AMQP server',  async function() {
    const mockedAMQPLib = {
      connect: sinon.spy()
    };

    const MockedTransport = injectToTransport(mockedAMQPLib);
    const instance = new MockedTransport(connectionURI);
    try {
      await instance.start();
    } catch(err) {
      // Ignore unrelated errors
    }

    assert.ok(mockedAMQPLib.connect.called, 'connect not called');
    const connectFirstArgument = mockedAMQPLib.connect.args[0][0];
    assert.strictEqual(connectFirstArgument, connectionURI, 'connect parameter is not the provided URI');
  });

  it('should create a channel to communicate client and server and save it', async function() {
    const fakeChannel = {};
    const mockedConnection = {
      createChannel: sinon.stub().resolves(fakeChannel)
    };

    const mockedAMQPLib = {
      connect: sinon.stub().resolves(mockedConnection)
    };

    const MockedTransport = injectToTransport(mockedAMQPLib);
    const instance = new MockedTransport(connectionURI);
    try {
      await instance.start();
    } catch(err) {
      // Ignore unrelated errors
    }

    assert.ok(mockedConnection.createChannel.called, 'connection.createChannel not called');
    assert.strictEqual(fakeChannel, instance._channel, 'channel not available at _channel');
  });

  it('should ensure the exchange exists', async function() {
    const mockedChannel = {
      assertExchange: sinon.spy()
    };

    const mockedConnection = {
      createChannel: sinon.stub().resolves(mockedChannel)
    };

    const mockedAMQPLib = {
      connect: sinon.stub().resolves(mockedConnection)
    };

    const MockedTransport = injectToTransport(mockedAMQPLib);
    const instance = new MockedTransport(connectionURI);
    try {
      await instance.start();
    } catch(err) {
      // Ignore unrelated errors
    }
    assert.ok(mockedChannel.assertExchange.called, 'channel.assertExchange not called');

    const assertExchangeName = mockedChannel.assertExchange.args[0][0];
    assert.strictEqual(assertExchangeName, instance.options.exchangeName);
    const assertExchangeType = mockedChannel.assertExchange.args[0][1];
    assert.strictEqual(assertExchangeType, 'topic', 'Exchange type is not "topic"');
  });

});
