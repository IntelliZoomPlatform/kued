'use strict';

const _ = require('lodash');
const async = require('async');
const CronJob = require('cron').CronJob;

class IronMQInput {

  /**
   * Initialize with Bridge Configuration, IMQ Connection Configuration, and the Logger.
   *
   * Note: _queue is for injecting mocks.
   *
   * @param config {Object} Bridge Configuration
   * @param logger {Logger}
   * @param imq {Object} IronMQ Client Instance
   */
  constructor(config, logger, imq){

    config.options = config.options || {};
    config.options.imq = config.options.imq || {};

    // Default, every minute.
    const cronTime = config.options.imq.cronTime || '* 1 * * * *';
    this.queueName = config.input.slice(config.input.indexOf(':') + 1);

    this.messagesPerRequest = config.options.imq.messagesPerRequest || 100;
    this.timeout = config.options.imq.timeout || 1;

    this.logger = logger;

    this.queue = imq.queue(this.queueName);

    this.cron = new CronJob({ cronTime, onTick: this.tick.bind(this), start: false });
    this.dispatch = null;
  }

  onMessage(handler){
    this.dispatch = handler;
  }

  createDispatchTask(message){
    return (done) => {
      this.dispatch(message, (err) => {
        if (err){
          this.logger.log(['error'], { message: 'Error dispatching message.', error: err });
          return done(null, null);
        }
        return done(null, message);
      });
    };
  }

  tick(){

    if (this.dispatch === null){
      throw new Error('No message handler was set.  Who am I supposed to provide this message to?');
    }

    this.queue.reserve({ n: this.messagesPerRequest, timeout: this.timeout }, (err, messages) => {

      if (err) {
        return this.logger.log(['error'], {message: 'Could not retrieve messages from IronMQ.', error: err});
      }

      const tasks = [];

      messages.forEach((message) => {
        tasks.push(this.createDispatchTask(message));
      });

      async.parallelLimit(tasks, 10, (err, messages) => {
        
        if (err) {
          return this.logger.log(['error'], {message: 'Could not dispatch messages received from IronMQ.', error: err});
        }

        const reservation_ids = _.compact(messages);

        this.queue.del_multiple({reservation_ids}, (err) => {
          if (err) return this.logger.log(['error'], { message: 'Could not delete messages:', error: err });
          this.logger.log(['debug'], { message: `Deleted ${reservation_ids.length} messages from IronMQ.` });
        });
      });
    });
  }

  init(){
    this.start();
  }

  start(){
    this.cron.start();
  }

  stop(){
    this.cron.stop();
  }
}

module.exports = IronMQInput;