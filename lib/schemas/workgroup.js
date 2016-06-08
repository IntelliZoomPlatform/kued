'use strict';

const Joi = require('joi');

const WorkGroup = Joi.object().keys({
  name: Joi.string(),
  workers: Joi.array().items(Joi.string()).required(),
  instances: Joi.number().integer().min(1).default(1)
}).unknown(true);

module.exports = WorkGroup;