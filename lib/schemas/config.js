'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  providers: Joi.array().items(
    require('./provider'),
    require('./kue'),
    require('./imq'),
    require('./checkpointer')),
  workers: Joi.array().items(require('./worker')),
  bridges: Joi.array().items(require('./bridge')),
  workgroups: Joi.array().items(require('./workgroup'))
});