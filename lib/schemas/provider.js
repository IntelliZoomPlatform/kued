'use strict';

const Joi = require('joi');

const ProviderSchema = Joi.object().keys({
  name: Joi.string(),
  provides: Joi.string().required(),
  require: Joi.string().required()
}).unknown(true);

module.exports = ProviderSchema;