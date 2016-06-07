'use strict';

const Kue = require('kue');
const Joi = require('joi');
const KueSchema = require('../schemas/kue');

class KueFactory {

  static options(){
    return {
      singleton: true,
      mode: 'factory'
    }
  }

  /**
   * Create a new instance of the Kue interface
   * @param config
   * @param logger
   * @param _kue {Object} used for testing
   * @returns {Queue}
   */
  static create(config, logger, _kue){

    const kue = _kue || Kue;
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

module.exports = KueFactory;