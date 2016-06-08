'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const BridgeSchema = require('../../../../lib/schemas/bridge');

describe('Bridges Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, BridgeSchema);
    expect(shouldBeValid.error).to.be.null;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, BridgeSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid bridge configuration', function(){

    expectToBeValid({
      name: "PaymentsBridge",
      output: "img:payment-updates",
      input: "kue:payment-processor",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToBeValid({
      name: "PaymentsBridge",
      output: "img:payment-updates",
      input: "kue:payment-processor"
    });

    expectToNotBeValid({
      name: "PaymentsBridge",
      output: "img:payment-updates",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToNotBeValid({
      name: "PaymentsBridge",
      input: "img:payment-updates",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToNotBeValid({
      output: "img:payment-updates",
      input: "kue:payment-processor",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToNotBeValid({
      output: "img:payment-updates",
      input: "kue:payment-processor",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });
  });


});