'use strict';

const _ = require('lodash');
const Joi = require('joi');
const CronJob = require('cron').CronJob;
const CronSchema = require('./schemas/cron');
const Worker = require('./worker');

/**
 * Implementation of a Worker that uses a timer to invoke some action.
 */
class CronWorker extends Worker {

  /**
   * Create an instance of the CRON Agent.
   * @param config {{ cron: { cronTime } }} refer to schemas/cron.js for all of the options.
   * @param checkpointer {RedisCheckPointer|null}
   * @param logger {Logger}
   * @param queue {Queue}
   */
  constructor(config, logger, checkpointer, queue){

    super(config, logger, checkpointer, queue);

    const result = Joi.validate(config.cron, CronSchema);

    if (result.error) throw new Error(result.error);

    config.cron = result.value;

    if (_.isString(config.cron.onTick)){
      if (!this[config.cron.onTick])
        throw new Error(`Could not find 'onTick' method named '${config.cron.onTick}' on CronWorker.`);
      config.cron.onTick = this[config.cron.onTick].bind(this);
    }

    if (_.isString(config.cron.onComplete)){
      if (!this[config.cron.onComplete])
        throw new Error(`Could not find 'onComplete' method named '${config.cron.onComplete}' on CronWorker.`);
      config.cron.onComplete = this[config.cron.onComplete].bind(this);
    }

    this.cronOptions = _.merge({
      onTick: this.tick.bind(this)
    }, config.cron);
  }

  /**
   * Start the CRON timer on init.
   */
  init(){
    super.init();
    // Create the CRON job.
    this.cron = new CronJob(this.cronOptions);
    this.cron.start();
  }

  /**
   * Resume a paused CRON timer.
   */
  resume(){
    this.log(['info'], 'Resuming the CRON timer.');
    this.cron.start();
  }

  /**
   * Pause the CRON timer.
   */
  pause(){
    this.log(['info'], 'Stopping the CRON timer.');
    this.cron.stop();
  }

  /**
   * Override me please!  You can also opt to use a different method by adding it to the
   * Cron config (onTick property).
   */
  tick(){}
}

module.exports = CronWorker;