'use strict';

const kue = require('kue');
const Joi = require('joi');
const KueSchema = require('./schemas/kue');

class QueueFactory {

  static create(config){

    const result = Joi.validate(config, KueSchema);

    if (result.error) throw new Error(result.error);

    config = result.value;

    const queue = kue.createQueue(config.connection);

    // Watch stuck jobs if defined
    if (config.watchStuckInterval){
      queue.watchStuckJobs(config.watchStuckInterval);
    }

    return queue;
  }
}

module.exports = QueueFactory;