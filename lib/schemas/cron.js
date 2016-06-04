'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  cronTime: Joi.string().required(),
  onComplete: Joi.alternatives().try(Joi.string(), Joi.func()),
  onTick: Joi.alternatives().try(Joi.string(), Joi.func()),
  timeZone: Joi.string()
});