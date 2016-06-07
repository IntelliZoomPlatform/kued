'use strict';

const Joi = require('joi');
const ProviderSchema = require('./provider');

const CheckpointerSchema = ProviderSchema.keys({
  name: Joi.string().default('default'),
  provides: Joi.string().default('checkpointer'),
  require: Joi.string().required(),
  options: Joi.object()
});

module.exports = CheckpointerSchema;