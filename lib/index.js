'use strict';

const amqplib = require('amqplib');

const injectToTransport = require('./transport');
const injectToServiceTransport = require('./serviceTransport');

const ServiceTransport = injectToServiceTransport();
const Transport = injectToTransport(amqplib, ServiceTransport);

module.exports = {
  Transport, ServiceTransport
};
