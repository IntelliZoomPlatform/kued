'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const WorkersSchema = require('../../../../lib/schemas/workers');

describe('Workers Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, WorkersSchema);
    expect(shouldBeValid.error).to.be.null;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, WorkersSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid worker configuration', function(){

    expectToBeValid([{
      name: 'MyWorker',
      require: './lib/workers/worker'
    }]);

    expectToBeValid([{
      name: 'MyWorker',
      require: './lib/workers/worker',
      options: {}
    }]);

    expectToBeValid([{
        name: 'MyWorker',
        require: './lib/workers/worker'
      }, {
        name: 'MyWorker2',
        require: './lib/workers/worker2',
        options: {}
    }]);

    expectToNotBeValid([{
      name: 'Blah'
    }]);

    expectToNotBeValid([{
      require: './worker'
    }]);

    expectToNotBeValid([{
      name: 'Blah',
      require: './worker',
      options: 'asdfadsf'
    }]);

    expectToNotBeValid([{
      name: 'MyWorker',
      require: './lib/workers/worker',
      options: {}
    }, {
      require: './worker'
    }])
  });

});