'use strict';

const _ = require('lodash');
const assert = require('assert');
const Checkpoint = require('./checkpoint');
const registry = require('./registry');

/**
 * Kue Worker.
 */
class Worker {

  /**
   * Initialize the worker.
   * @param config
   * @param logger
   * @param checkpointer {Checkpoint}
   * @param queue {Queue} The queue this process is bound too.
   */
  constructor(config, logger, queue, checkpointer){
    this.config = config;
    this.logger = logger;
    this.log = logger.log.bind(logger);
    this.queue = queue;

    // This allows workers to register distribution-wide information needed
    // to make decisions about whether a job should be processed.
    this.checkpointer = checkpointer;
  }

  static get dependencies(){
    return [
      { provider: 'logger' },
      { provider: 'kue' },
      { provider: 'checkpointer', optional: true }
    ];
  }

  /**
   * Per the framework's recommendations, wrap queue.process catching errors
   * that may have been uncaught by the handler.
   * @param topic {String} name of the topic to process.
   * @param concurrency {Number} number of messages to retrieve at one time.
   * @param handler {Function} handles incoming messages.
   */
  process(topic, concurrency, handler){

    if (_.isFunction(concurrency)){
      handler = concurrency;
      concurrency = 1;
    }

    if (_.isString(handler) && this[handler]){
      handler = this[handler].bind(this);
    }

    // Ensure the handler is a function.
    assert.ok(_.isFunction(handler), 'Check your handler registration syntax.');

    this.queue.process(topic, concurrency, (job, context, done) => {
      try {
        handler(job, context, done);
      }
      catch (e){
        this.log(['error'], `Job failed to complete do to unhandled exception: ${e}.`);
        done(e);
      }
    });
  }

  /**
   * Create a new checkpoint process.
   * @returns {Checkpoint}
   */
  checkpoint(){
    assert.ok(
      _.isObject(this.checkpointer),
      'Ensure a valid checkpointer has been registered with the worker before using the checkpoint facility.');
    return new Checkpoint(this.logger, this, this.checkpointer);
  }

  /**
   * Initialize the service.  Override if you have some particular logic you want executed.
   *
   * TODO: Auto registration -- after I figure out the best semantics.
   *
   */
  init(){}

  /**
   * Report an Error (to Kue client and logger).
   * @param job {Job}
   * @param message {String}
   * @param err {Error}
   */
  reportError(job, message, err){
    job.log(`Error: ${message}`);
    this.log(['error', { message, err }]);
  }
}




module.exports = Worker;