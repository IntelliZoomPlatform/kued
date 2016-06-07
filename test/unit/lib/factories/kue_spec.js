'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const KueFactory = require('../../../../lib/factories/kue');
const Logger = require('../../../logger');
const logger = new Logger();

describe('Kue Factory', function(){

  it('should throw an error if the Kue configuration is not correct', function(){

    expect(function(){

      KueFactory.create({});

    }).to.throw(Error);
  });

  it('should create a connection and then configure the queue', function(){

    const queue = {
      watchStuckJobs: sinon.spy()
    };

    const kue = {
      createQueue: sinon.stub()
    };

    kue.createQueue.returns(queue);

    KueFactory.create({ watchStuckInterval: 142, connection: { redis: {} }}, logger, kue);

    expect(kue.createQueue).to.be.called;
    expect(queue.watchStuckJobs).to.be.calledWith(142);
  });
});