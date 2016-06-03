'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  token: Joi.string().alphanum().min(10).required(),
  project_id: Joi.string().alphanum().min(10).required()
});