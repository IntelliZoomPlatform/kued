'use strict';

const _ = require('lodash');
const CronJob = require('cron').CronJob;
const Worker = require('./worker');

/**
 * Implementation of a Worker that uses a timer to invoke some action.
 */
class CronWorker extends Worker {

  /**
   * Create an instance of the CRON Agent.
   * @param options {Object} Of node-cron format (must include "cronTime")
   * @param config {Object}
   * @param logger {Logger}
   * @param queue {Queue}
   */
  constructor(options, config, logger, queue){
    super(config, logger, queue);

    this.cronOptions = _.merge({
      start: false,
      onTick: this.tick.bind(this)
    }, options);
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
   * Override me please!
   */
  tick(){}
}

module.exports = CronWorker;