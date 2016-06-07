'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  provider: Joi.string().required(),
  name: Joi.string(),
  optional: Joi.boolean().default(false)
});