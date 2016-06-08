'use strict';

const _ = require('lodash');
const async = require('async');
const assert = require('assert');
const moment = require('moment');
const DependencyManager = require('./dependency-manager');

const Joi = require('joi');
const WorkGroupSchema = require('./schemas/workgroup');

const BridgeFactory = require('./bridge-factory');
const WorkerFactory = require('./worker-factory');

// Monkey patch the method PM2 adds for Node communication.
if (!process.send) process.send = _.noop;

class Workgroup {

  constructor(argv){

    assert.ok(argv._.length >= 2, 'Bad argv syntax when launching.  Should be "workgroup.js [run] [base64-config]"');

    const command = argv._[0];
    const config = Workgroup.decode(argv._[1]);

    this.dependencyManager = new DependencyManager(config.providers);

    this.logger = this.dependencyManager.getLogger();

    this.workers = {};
    this.bridges = {};

    this.execute(command, config);
  }

  static decode(configString){
    return JSON.parse((new Buffer(configString, 'base64')).toString('utf8'));
  }

  notifyMaster(type, message, data){
    process.send({
      type : 'process:msg',
      data : { type, message, data, timestamp: moment().toISOString() }
    });
  }

  static findByName(items, name){
    return _.find(items, (item) => item.name === name);
  }

  register(category, config, instance){
    assert.ok(!!this[category], `Unknown component category: ${category}`);
    this[category][config.name] = { config, instance };
  }

  createSpawnTask(Factory, category, config){
    return (next) => {
      try {
        const component = Factory.create(this.dependencyManager, config);
        this.register(category, config, component);
      }
      catch (e){
        return next(e);
      }
      next();
    };
  }

  spawnWorkers(nodeConfig){

    let workgroup = nodeConfig.workgroup;
    const workgroupCheck = Joi.validate(workgroup, WorkGroupSchema);

    if (workgroupCheck.error){
      return this.logError('Could not launch workgroup; invalid configuration', workgroupCheck.error);
    }

    workgroup = workgroupCheck.value;

    const workers = _.compact(_.map(workgroup.workers, (name) => Workgroup.findByName(nodeConfig.workers, name)));
    const bridges = _.compact(_.map(workgroup.workers, (name) => Workgroup.findByName(nodeConfig.bridges, name)));

    if ((workers.length + bridges.length) !== workgroup.workers.length){
      const missingWorkers = _.difference(workgroup.workers, _.map(workers.concat(bridges), 'name'));
      return this.logError(`Workgroup includes workers not present in worker specification: ${missingWorkers}`);
    }

    const tasks = [];

    Array.prototype.push.apply(tasks,
      workers.map((config) => this.createSpawnTask(WorkerFactory, 'workers', config)));

    Array.prototype.push.apply(tasks,
      bridges.map((config) => this.createSpawnTask(BridgeFactory, 'bridges', config)));

    async.parallel(tasks, (err) => {
      if (err) {
        return this.logError('An error occurred spawning workers and bridges for WorkGroup.', err);
      }

      this.logInfo('workers-spawned', `Workgroup has spawned ${workers.length} workers and ${bridges.length} bridges`);
    });
  }

  execute(command, data){

    switch(command){
      case 'run': this.spawnWorkers(data); break;
      default:
        this.logError(`Received unknown command: ${command}`, { command });
        break;
    }
  }

  logInfo(topic, message, data){
    data = data || {};
    this.logger.log(['info'], { topic, message });
    this.notifyMaster(topic, message, data)
  }

  logError(message, error){
    if (!error) error = new Error(message);
    this.logger.log(['error'], { message, error });
    this.notifyMaster('error', message, error);
  }
}

module.exports = Workgroup;