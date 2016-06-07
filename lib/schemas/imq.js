'use strict';

const Joi = require('joi');
const ProviderSchema = require('./provider');

module.exports = ProviderSchema.keys({
  // Override the default provides schema requirement
  provides: Joi.string().default('imq'),
  require: Joi.string().default('kued/lib/factories/imq'),
  token: Joi.string().alphanum().min(10).required(),
  project_id: Joi.string().alphanum().min(10).required()
});