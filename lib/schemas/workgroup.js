'use strict';

const Joi = require('joi');

const WorkGroup = Joi.object().keys({
  workers: Joi.array().items(Joi.string()).required(),
  instances: Joi.number().integer().min(1).default(1)
});

module.exports = WorkGroup;