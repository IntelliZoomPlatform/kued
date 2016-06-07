'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const WorkerSchema = require('../../../../lib/schemas/worker');

describe('Workers Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, WorkerSchema);
    expect(shouldBeValid.error).to.be.null;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, WorkerSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid worker configuration', function(){

    expectToBeValid({
      name: 'MyWorker',
      require: './lib/workers/worker'
    });

    expectToBeValid({
      name: 'MyWorker',
      require: './lib/workers/worker',
      options: {}
    });

    expectToNotBeValid({
      name: 'Blah'
    });

    expectToNotBeValid({
      require: './worker'
    });

    expectToNotBeValid({
      name: 'Blah',
      require: './worker',
      options: 'asdfadsf'
    });
  });

});