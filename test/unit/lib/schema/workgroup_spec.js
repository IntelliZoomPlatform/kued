'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const WorkGroupSchema = require('../../../../lib/schemas/workgroup');

describe('WorkGroups Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, WorkGroupSchema);
    expect(shouldBeValid.error).to.be.null;
    return shouldBeValid;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, WorkGroupSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid work groups configuration', function(){

    expectToBeValid({
      workers: ['MyWorker']
    });

    expectToBeValid({
      workers: ['MyWorker', 'MyWorker2']
    });

    expectToBeValid({
      workers: ['MyWorker'],
      instances: 3
    });

    expectToNotBeValid({
      workers: 'MyWorker'
    });

    expectToNotBeValid({
      workers: ['MyWorker'],
      instances: 'asdf'
    });
  });

  it('should set the number of instances to 1 if not provided', function(){

    const result = expectToBeValid({
      workers: ['MyWorker']
    });

    expect(result.value.instances).to.not.be.undefined;
    expect(result.value.instances).to.eq(1);
  });

});