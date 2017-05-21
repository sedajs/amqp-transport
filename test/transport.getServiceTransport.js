'use strict';

const assert = require('assert');
const sinon = require('sinon');

const Transport = require('../lib').Transport;
const ServiceTransport = require('../lib').ServiceTransport;
const injectToTransport = require('../lib/transport');

describe('AMQPTransport#getServiceTransport()', function() {
  const validName = 'foo';
  const connectionURI = 'amqp://localhost';
  let instance;
  beforeEach(() => {
    instance = new Transport(connectionURI);
  });

  it('should return a promise', function() {
    let value = instance.getServiceTransport();
    assert.ok(value instanceof Promise, 'Not a promise');

    // Ignore unrelated errors
    value.catch(() => {});
  });

  it('should call the ServiceTransport prepare method', async function() {
    const stub = sinon.stub().resolves();
    function MockedServiceTransport() {
      this.prepare = stub;
      this._channel = {
        consume: function() {}
      };
    }
    const Transport = injectToTransport({}, MockedServiceTransport);
    const instance = new Transport(connectionURI);
    instance.getServiceTransport('foo', function() {});
    assert.ok(stub.called, 'prepare not called');
  });

  it('should return a ServiceTransport when resolved', async function() {
    instance._channel = {
      assertQueue: () => Promise.resolve({ queue: 'foo' }),
      consume: () => Promise.resolve()
    };
    const value = await instance.getServiceTransport(validName);
    assert.ok(value instanceof ServiceTransport, 'Not a ServiceTransport');
  });
});
