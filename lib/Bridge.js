'use strict';

const _ = require('lodash');
const async = require('async');
const Joi = require('joi');
const IronMQClient = require('iron_mq').Client;
const CronAgent = require('./cronworker');

/**
 * Pulls messages off of an IronMQ queue creating queue jobs for each message (topic is the "to" param in config).
 */
class IronMQBridge extends CronAgent {

  /**
   * Instantiate the Agent.
   * @param config {Object} Bridge Configuration
   * @param logger {Logger}
   * @param _queue {Queue}
   */
  constructor(config, logger, _queue){

    super(config.cron, config, logger, _queue);

    Joi.validate(IronMQBridge.ConfigSchema, config);

    this.config = config;
    this.imq = new IronMQClient(config.iron);
    this.ironQueue = this.imq.queue(config.from);
  }

  static get ConfigSchema(){

    return Joi.object().keys({
      kue:  Joi.object().required(),
      iron: Joi.object().required(),
      from: Joi.string().required(),
      to:   Joi.string().required()
    });
  }

  init(){
    this.log(['info'], `Bridge for 'imq:${this.config.from}' -> 'kue:${this.config.to}' started.`);
    super.init();
  }

  forward(record, callback){
    this.queue
        .create(this.config.to, record)
        .attempts(5)
        .backoff( {type:'exponential'} )
        .save(callback);
  }

  createTask(message, record){
    return (next) => {
      this.forward(record, (err) => {
        if (err) {                                                                                     
          this.log(['error'], 'Could not forward message');
          // Don't fail, but also don't return the message.
          // We can _.compact() the null out of the ID list.
          return next(null, null);
        }
        return next(null, message);
      });
    };
  }

  tick(){
    this.log(['info'], 'Checking IronMQ for messages.');
    this.ironQueue.reserve({ n: 100, timeout: 1 }, (err, messages) => {

      // Build up a set of Async tasks to perform.  We want to delete the messages in batch,
      // as well as, parallelize the whole process.
      const tasks = messages.map((message) => {
        const record = JSON.parse(message.body);
        return this.createTask(message, record);
      });

      // Asynchronously execute the tasks.
      async.parallelLimit(tasks, 10, (err, reservation_ids) => {
        reservation_ids = _.compact(reservation_ids);
        this.queue.del_multiple({reservation_ids}, (err) => {
          if (err) return this.log(['error'], 'Could not delete messages:', err);
          this.log(['debug'], `Deleted ${reservation_ids.length} messages.`);
        });
      });
    });
  }
}

module.exports = IronMQBridge;