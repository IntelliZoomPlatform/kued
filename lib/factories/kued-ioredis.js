'use strict';

const Redis = require('ioredis');
const Kue = require('kue');
const Joi = require('joi');
const KueSchema = require('../schemas/kue');

/**
 * This is an implementation of the Kue provider that makes it easier to
 * instantiate Kue with static ioredis configuration.
 */
class KueWithIORedisFactory {

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

    const queue = kue.createQueue({
      redis: {
        createClientFactory: () => {
          return new Redis(config.connection.redis);
        }
      }
    });

    // Watch stuck jobs if defined
    if (config.watchStuckInterval){
      queue.watchStuckJobs(config.watchStuckInterval);
    }

    return queue;
  }
}

module.exports = KueWithIORedisFactory;