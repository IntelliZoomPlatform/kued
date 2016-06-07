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
      to: "img:payment-updates",
      from: "kue:payment-processor",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToBeValid({
      name: "PaymentsBridge",
      to: "img:payment-updates",
      from: "kue:payment-processor"
    });

    expectToNotBeValid({
      name: "PaymentsBridge",
      to: "img:payment-updates",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToNotBeValid({
      name: "PaymentsBridge",
      from: "img:payment-updates",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToNotBeValid({
      to: "img:payment-updates",
      from: "kue:payment-processor",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });

    expectToNotBeValid({
      to: "img:payment-updates",
      from: "kue:payment-processor",
      options: {
        concurrency: 12,
        accessToken: 'asdfadsfasdfasdfadsf'
      }
    });
  });


});