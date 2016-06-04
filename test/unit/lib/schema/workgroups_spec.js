'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const WorkGroupsSchema = require('../../../../lib/schemas/workgroups');

describe('WorkGroups Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, WorkGroupsSchema);
    expect(shouldBeValid.error).to.be.null;
    return shouldBeValid;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, WorkGroupsSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid work groups configuration', function(){

    expectToBeValid([{
      workers: ['MyWorker']
    }]);

    expectToBeValid([{
      workers: ['MyWorker', 'MyWorker2']
    }]);

    expectToBeValid([{
      workers: ['MyWorker'],
      instances: 3
    }]);

    expectToBeValid([{
        workers: ['MyWorker'],
        instances: 3
      }, {
        workers: ['MyWorker2', 'MyWorker3']
    }]);

    expectToNotBeValid([{
      workers: 'MyWorker'
    }]);

    expectToNotBeValid([{
      workers: ['MyWorker'],
      instances: 'asdf'
    }]);

    expectToNotBeValid([{
      workers: ['MyWorker']
    }, {
      workers: ['MyWorker2'],
      instances: 'asdf'
    }]);
  });

  it('should set the number of instances to 1 if not provided', function(){

    const result = expectToBeValid([{
      workers: ['MyWorker']
    }]);

    expect(result.value[0].instances).to.not.be.undefined;
    expect(result.value[0].instances).to.eq(1);
  });

});