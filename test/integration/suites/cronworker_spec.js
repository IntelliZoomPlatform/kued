'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const TestUtils = require('../../utils');

const queue = require('./queue');

const CronWorker = require('../../../lib/cronworker');
const Logger = require('../../logger');
const logger = new Logger();



describe('CronWorker', function(){


  it('should run a job on an interval.', function(next){

    this.timeout(5000);

    const handlerSpy = sinon.spy();
    const topic = `cronworker-test-${new Date().getTime()}`

    class TestWorker extends CronWorker {

      init(){
        this.count = 0;
        this.process(topic, 10, 'handler');
        super.init();
      }

      tick(){
        this.count++;
        if (this.count <= 3){
          this.queue.create(topic, {}).save();
        }
        else {
          this.pause();
        }
      }

      handler(job, context, done){
        handlerSpy();
        done();
      }
    }

    // Every second
    const worker = new TestWorker({ cron: { cronTime: '* * * * * *' } }, logger, null, queue);

    worker.init();

    setTimeout(TestUtils.wrapAsync(next, function(){

      expect(handlerSpy).to.have.callCount(3);

    }), 4000);
  });


});