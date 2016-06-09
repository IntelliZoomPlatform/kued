'use strict';

const kue = require('kue');

/**
 * Abstracts the execution of asynchronous tasks to fellow workers on the network.
 */
class TaskManager {

  /**
   * Initialize the service.
   * @param config {Object}
   * @param logger {Logger}
   */
  constructor(config, logger, queue){
    logger = logger || {};
    this.log = logger.log.bind(logger);
    this.queue = queue;
  }

  static get dependencies(){
    return [
      { provider: 'logger' },
      { provider: 'kue' }
    ];
  }

  /**
   * Enqueue a new task for one of the background workers.
   * @param topic {String} name of the topic
   * @param payload {*} Payload
   * @param callback {Null|Function} callback.
   * @returns {Null|Job} If the callback is supplied, then nothing will be returned.
   *           If no callback is supplied, then the Job is returned and it will be
   *           the caller's responsibility to execute "save()" on the job.
   */
  enqueue(topic, payload, callback){
    const job = this.queue.create(topic, payload);
    if (callback) return job.save(callback);
    return job;
  }

  /**
   * Close the connection to Redis.
   * @param callback
   */
  close(callback){
    this.queue.shutdown(1000, (err) => {
      if (err) return this.reportError(`Error closing the connection: ${err}.`, err, callback);
      callback();
    });
  }

  /**
   * Report the error and fire the callback.
   * @param message {String} Message to output to the logger.
   * @param err {Error} Error encountered during processing.
   * @param callback {Function} (err) : void
   */
  reportError(message, err, callback){
    this.log(['error'], message);
    return callback(err);
  }
}

module.exports = TaskManager;