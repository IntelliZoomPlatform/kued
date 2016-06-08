'use strict';

const Joi = require('joi');

const BridgeSchema = Joi.object().keys({
  name: Joi.string().required(),
  input: Joi.string().required(),
  output: Joi.string().required(),
  options: Joi.object()
});

module.exports = BridgeSchema;