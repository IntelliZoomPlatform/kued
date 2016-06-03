'use strict';

const Joi = require('joi');

const WorkerSchema = Joi.object().keys({
  name: Joi.string().required(),
  require: Joi.string().required(),
  options: Joi.object()
});

module.exports = Joi.array().items(WorkerSchema).min(1);