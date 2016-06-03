'use strict';

const _ = require('lodash');
const assert = require('assert');

/**
 * Defines a process whose processing is managed by a Checkpoint predicate.
 */
class Checkpoint {

  /**
   * Initialize the CheckPoint Process builder.
   * @param logger {Logger}
   * @param worker {Worker}
   * @param checkpointer {RedisCheckPointer}
   */
  constructor(logger, worker, checkpointer){
    this.log = logger.log;
    this.worker = worker;
    this._concurrency = 1;
    this._ignore = {
      checkpointFailure: false,
      checkpointAbsent: true
    };
    this.checkpointer = checkpointer;
  }

  /**
   * Set the topic of the process.
   * @param value
   * @returns {Checkpoint} this
   */
  topic(value){
    this._topic = value;
    return this;
  }

  /**
   * Set the concurrency or the process
   * @param value
   * @returns {Checkpoint} checkpoint
   */
  concurrency(value){
    this._concurrency = value;
    return this;
  }

  /**
   * Set the Key Factory that determines the specific checkpoints namespace
   * @param handler
   * @returns {Checkpoint}
   */
  keyFactory(handler){
    this._keyFactory = handler;
    return this;
  }

  /**
   * Set the predicate that determines whether processing should occur based on the job state and checkpoint value.
   * @param handler {Function} with signature (job.data, checkpoint, callback) => {} : void.
   *                          Callback signature is: (err, shouldProcess, extraData) => {} : void.
   *
   * @returns {Checkpoint}
   */
  iff(handler){
    this._predicate = handler;
    return this;
  }

  /**
   * If the checkpoint system fails, ignore the failure and continue processing.
   * @returns {Checkpoint}
   */
  ignoreCheckpointFailure(){
    this._ignore.checkpointFailure = true;
    return this;
  }

  /**
   * If the checkpoint's data is not available, fail the job.
   * @returns {Checkpoint}
   */
  failIfCheckpointAbsent(){
    this._ignore.checkpointAbsent = false;
    return this;
  }
  
  /**
   * Register the handler for processing messages.
   * @param handler {Function}  Handler signature: (job, context, callback, [extraData passed from IFF]) => {} : void
   *                            And the callback signature: (err, newCheckpointValue) => {} : void.
   */
  process(handler){
    if (_.isString(handler) && this.worker[handler]){
      handler = this.worker[handler].bind(this.worker);
    }
    assert.ok(_.isString(this._topic), 'Topic must be a string supplied to the checkpoint.');
    assert.ok(_.isFunction(handler), 'Handler must be a function or the name of the method to call on the worker.');
    assert.ok(_.isFunction(this._predicate), 'Predicate must be a function supplied to the checkpoint.');
    assert.ok(_.isFunction(this._keyFactory), 'Key factory must be a function supplied to the checkpoint.');
    this.worker.process(this._topic, this._concurrency, (job, context, done) => {
      const key = this._keyFactory(job.data);
      this.checkpointer.getCheckpoint(key, (err, value) => {
        if (err) {
          this.log(['error'], `Could not get checkpoint [${key}] value: ${err}`);
          if (!this._ignore.checkpointFailure) return done(err);
        }
        if (_.isUndefined(value) || _.isNull(value)){
          this.log(['warn'], `No checkpoint value for ${key}.`);
          if (!this._ignore.checkpointAbsent) return done(new Error(`Checkpoint value for key '${key}' was absent.`));
        }
        this._predicate(job.data, value, (err, shouldContinue, predicateData) => {
          if (err) return done(err);
          if (shouldContinue){
            handler(job, context, (err, newCheckpoint) => {
              if (err) return done(err);
              if (!_.isUndefined(newCheckpoint)) this.checkpointer.updateCheckpoint(key, newCheckpoint, (err) => {
                if (err) this.log(['error'], `Failed to update checkpoint [${key}]: ${err}.`);
                else this.log(['info'], `Checkpoint [${key}] updated.`);
                return done(err);
              });
              else done();
            }, predicateData);
          }
          else {
            this.log(['info'], `Nothing to do; [${key}] does not need to be updated.`);
            return done();
          }
        });

      });
    });
  }
}

module.exports = Checkpoint;