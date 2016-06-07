'use strict';

const Joi = require('joi');
const ProviderSchema = require('./provider');
const RedisSchema = require('./redis');

const ConnectionSchema = Joi.object().keys({
  prefix: Joi.string().default('kue'),
  redis: RedisSchema
});

module.exports = ProviderSchema.keys({
  // Override the default provides schema requirement
  provides: Joi.string().default('kue'),
  require: Joi.string().default('kued/lib/factories/kue'),
  watchStuckInterval: Joi.number().integer().min(100).default(1000),
  connection: ConnectionSchema.required()
});