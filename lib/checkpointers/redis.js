'use strict';

const redis = require('redis');

/**
 * A service that maintains state about checkpoints (synchronization primitives)
 * regarding the state of capture within the system.
 */
class RedisCheckPointer {

  /**
   * Initialize the service
   * @param config {Object} configuration; root at 'redis' property.
   * @param logger {Logger}
   */
  constructor(config, logger){
    this.config = config;
    this.prefix = config.prefix || 'checkpoint';
    this.logger = logger;
    this.log = logger.log.bind(logger);
    this.client = this.createClient();
  }

  /**
   * Initialize the Redis Client.
   * @returns {RedisClient}
   */
  createClient(){

    const client = redis.createClient(this.config.connection);

    client.on('connect', () => {
      this.log(['info'], 'Connected to Redis.');
      if (this.config.hasOwnProperty('db')){
        this.client.select(this.config.db, (err) => {
          if (err) this.log(['error'], `Could not select the Redis DB: ${this.config.db}`);
        });
      }
    });

    client.on('error', (err) => {
      this.log(['error'], `Error connecting to Redis: ${err}`);
    });

    return client;
  }

  /**
   * Get the key name by appending the prefix.
   * @param namespace
   * @returns {*}
   */
  getKey(namespace){
    return `${this.prefix}:${namespace}`;
  }

  /**
   * Get checkpoint value
   * @param namespace
   * @param callback
   */
  getCheckpoint(namespace, callback){

    let key = this.getKey(namespace);

    this.client.get(key, (err, value) => {
      if (err){
        this.log(['error'], `Could not retrieve checkpoint [${key}] from Redis: ${err}`);
      }
      // Attempt to parse the checkpoint value.
      try {
        value = JSON.parse(value);
      }
      catch (e){}
      callback(err, value);
    });
  }

  /**
   * Update the checkpoint value.
   * @param namespace
   * @param value
   * @param callback
   */
  updateCheckpoint(namespace, value, callback){

    const key = this.getKey(namespace);
    const jsonValue = JSON.stringify(value);

    this.client.set(key, jsonValue, (err) => {
      if (err){
        this.log(['error'], `Could not set checkpoint [${key}] in Redis: ${err}`);
      }
      callback(err);
    });
  }
}

module.exports = RedisCheckPointer;