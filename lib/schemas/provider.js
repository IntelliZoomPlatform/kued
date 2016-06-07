'use strict';

const Joi = require('joi');

const ProviderSchema = Joi.object().keys({
  name: Joi.string(),
  provides: Joi.string().required(),
  require: Joi.alternatives().try(Joi.string(), Joi.object(), Joi.func()).required()
}).unknown(true);

module.exports = ProviderSchema;