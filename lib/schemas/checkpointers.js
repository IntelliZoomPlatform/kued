'use strict';

const Joi = require('joi');

const CheckpointerSchema = Joi.object().keys({
  name: Joi.string().default('default'),
  require: Joi.string().required(),
  options: Joi.object()
});

module.exports = Joi.array().items(CheckpointerSchema).min(1);