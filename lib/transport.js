'use strict';

module.exports = function injectToTransport(amqplib, ServiceTransport) {
  function AMQPTransport(connectionURI, options={}) {
    if (!(this instanceof AMQPTransport)) return new AMQPTransport(connectionURI);

    if (!connectionURI) throw new Error('Missing connection URI in AMQPTransport constructor');
    this.connectionURI = connectionURI;

    this.options = Object.assign({}, options);
    this.options.exchangeName = options.exchangeName || 'entrypoint';
  }
  const proto = AMQPTransport.prototype;

  proto.start = async function start() {
    const connection = await amqplib.connect(this.connectionURI);
    const channel = await connection.createChannel();
    this._channel = channel;
    await channel.assertExchange(this.options.exchangeName, 'topic');
  };

  proto.getServiceTransport = async function(serviceName) {
    const serviceTransport = new ServiceTransport(this._channel, serviceName, this.options.exchangeName);
    await serviceTransport.prepare();
    return serviceTransport;
  };

  return AMQPTransport;
};
