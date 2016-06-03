'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const Joi = require('joi');
chai.use(sinonChai);

const QueueFactory = require('../../../lib/queue-factory');
const Logger = require('../../logger');
const logger = new Logger();

describe('Queue Factory', function(){

  it('should throw an error if the Kue configuration is not correct', function(){

    expect(function(){

      QueueFactory.create({});

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

    QueueFactory.create({ watchStuckInterval: 142, connection: { redis: {} }}, kue);

    expect(kue.createQueue).to.be.called;
    expect(queue.watchStuckJobs).to.be.calledWith(142);
  });
});