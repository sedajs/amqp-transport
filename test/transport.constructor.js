'use strict';

const Transport = require('../lib').Transport;
const assert = require('assert');

const validConnectionURI = 'asd';

describe('Transport constructor', function() {
  it('should be instantiable', function() {
    const instance = new Transport(validConnectionURI);
    assert.ok(instance instanceof Transport);
  });

  it('should be instantiable without "new" keyword', function() {
    const instance = Transport(validConnectionURI);
    assert.ok(instance instanceof Transport);
  });

  it('should fail if no connection URI provided', function() {
    assert.throws(() => {
      const instance = new Transport();
    }, /Missing connection URI in AMQPTransport constructor/);
  });

  it('should assign the connection URI to connectionURI property', function() {
    const instance = new Transport(validConnectionURI);
    assert.strictEqual(validConnectionURI, instance.connectionURI, 'Connection URI differs');
  });

  it('should accept an optional "exchangeName" option', function() {
    const options = {
      exchangeName: 'foobar'
    };
    const instance = new Transport(validConnectionURI, options);
    assert.strictEqual(options.exchangeName, instance.options.exchangeName);
  });

  it('"exchangeName" property should default to "entrypoint" if none provided', function() {
    const instance = new Transport(validConnectionURI);
    assert.strictEqual('entrypoint', instance.options.exchangeName);
  });
});
