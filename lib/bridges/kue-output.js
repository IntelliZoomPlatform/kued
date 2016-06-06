'use strict';

class KueOutput {

  constructor(config, queue, logger){

    config.options = config.options || {};
    config.options.kue = config.options.kue || {};

    this.priority = config.options.kue.priority || 0;
    this.attempts = config.options.kue.attempts || 1;
    this.backoff = config.options.kue.backoff || true;

    this.ttl = config.options.kue.ttl || null;
    this.delay = config.options.kue.delay || null;

    this.topicName = config.output.slice(config.output.indexOf(':') + 1);
    this.logger = logger;
    this.queue = queue;
  }

  dispatch(message, done){
    const job = this.queue.create(this.topicName, message).priority(this.priority).attempts(this.attempts);
    if(this.ttl) job.ttl(this.ttl);
    if(this.delay) job.delay(this.delay);
    job.save((err) => {
      if (err){
        this.logger.log(['error'], { message: 'Failed to forward message.', error: err });
        return done(err);
      }
      this.logger.log(['debug'], { message: 'Forwarded message successfully.' });
      return done();
    });
  }
}

module.exports = KueOutput;