'use strict';

const _ = require('lodash');
const assert = require('assert');

/**
 * Couples an input with an output.
 */
class Bridge {

  /**
   * Instantiate the Bridge
   * @param logger {Logger} logging interface
   * @param input {*} Object conforming to the input signature.
   * @param output {*} Object conforming to the output signature.
   */
  constructor(logger, input, output){
    this.logger = logger;

    assert.ok(_.isFunction(input.onMessage), 'The "onMessage" function is required for the input interface.');
    assert.ok(_.isFunction(output.dispatch), 'The "dispatch" function is required for the output interface.');

    this.input = input;
    this.output = output;
    this.input.onMessage(this.handleIncomingMessage.bind(this));
  }

  /**
   * Initialize the Bridge.
   */
  init(){
    this.start();
  }

  handleIncomingMessage(message, done){
    this.logger.log(['debug'], { message: 'Received message on the bridge; dispatching...' });
    this.output.dispatch(message, (err) => {
      if (err) {
        this.logger.log(['error'], { message: 'Error dispatching message.', error: err });
        return done(err);
      }
      this.logger.log(['debug'], { message: 'Message successfully dispatched.' });
      done();
    });
  }

  /**
   * Start the bridge.
   */
  start(){
    this.logger.log(['debug'], { message: 'Starting bridge.' });
    if (this.input.start) this.input.start();
    if (this.output.start) this.output.start();
  }

  /**
   * Stop the bridge.
   */
  stop(){
    this.logger.log(['debug'], { message: 'Stopping bridge.' });
    if (this.input.stop) this.input.stop();
    if (this.output.stop) this.output.stop();
  }
}

module.exports = Bridge;