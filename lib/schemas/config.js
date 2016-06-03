'use strict';

const Joi = require('joi');

module.exports = Joi.object().keys({
  kue: require('./kue').required(),
  imq: require('./imq'),
  checkpointers: require('./checkpointers'),
  workers: require('./workers'),
  bridges: require('./bridges'),
  workgroups: require('./workgroups')
});