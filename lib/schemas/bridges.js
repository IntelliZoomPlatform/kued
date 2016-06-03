'use strict';

const Joi = require('joi');

const BridgeSchema = Joi.object().keys({
  name: Joi.string().required(),
  to: Joi.string().required(),
  from: Joi.string().required(),
  options: Joi.object()
});

module.exports = Joi.array().items(BridgeSchema).min(1);