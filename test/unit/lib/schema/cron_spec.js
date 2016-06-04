'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const Joi = require('joi');
const CronSchema = require('../../../../lib/schemas/cron');

describe('Cron Schema', function(){

  const expectToBeValid = function(config){
    const shouldBeValid = Joi.validate(config, CronSchema);
    expect(shouldBeValid.error).to.be.null;
  };

  const expectToNotBeValid = function(config){
    const shouldNotBeValid = Joi.validate(config, CronSchema);
    expect(shouldNotBeValid.error).to.not.be.null;
  };

  it('should allow valid Cron configuration', function(){

    expectToBeValid({
      cronTime: '10 * * * * *'
    });

    expectToBeValid({
      cronTime: '10 * * * * *',
      onTick: 'tick',
      onComplete: 'complete'
    });

    expectToBeValid({
      cronTime: '10 * * * * *',
      onTick: _.noop,
      onComplete: _.noop
    });

    expectToBeValid({
      cronTime: '10 * * * * *',
      onTick: _.noop,
      onComplete: 'complete',
      timeZone: 'America/Los_Angeles'
    });

    expectToNotBeValid({});

    expectToNotBeValid({
      cronTime: 123
    });

    expectToNotBeValid({
      cronTime: '10 * * * * *',
      onTick: 1234
    });
  });
});