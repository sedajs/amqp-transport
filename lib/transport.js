'use strict';

const debug = require('debug')('amqptransport:transport');

module.exports = function injectToTransport(amqplib, ServiceTransport) {
  function AMQPTransport(connectionURI, options={}) {
    if (!(this instanceof AMQPTransport)) return new AMQPTransport(connectionURI);

    if (!connectionURI) throw new Error('Missing connection URI in AMQPTransport constructor');
    this.connectionURI = connectionURI;

    this.options = Object.assign({}, options);
    this.options.exchangeName = options.exchangeName || 'entrypoint';
    debug('Created. URI: ' + this.connectionURI + ' Exchange: ' + this.options.exchangeName);
  }
  const proto = AMQPTransport.prototype;

  proto.start = async function start() {
    debug('Connecting');
    const connection = await amqplib.connect(this.connectionURI);
    debug('Creating channel');
    const channel = await connection.createChannel();
    this._channel = channel;
    debug('Asserting exchange');
    await channel.assertExchange(this.options.exchangeName, 'topic');
  };

  proto.getServiceTransport = async function(serviceName) {
    debug('Creating service transport for ' + serviceName);
    const serviceTransport = new ServiceTransport(this._channel, serviceName, this.options.exchangeName);
    await serviceTransport.prepare();
    return serviceTransport;
  };

  return AMQPTransport;
};
