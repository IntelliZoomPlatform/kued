'use strict';

const _ = require('lodash');
const pm2 = require('pm2');
const async = require('async');
const assert = require('assert');
const Path = require('path');
const Joi = require('joi');
const ConfigSchema = require('./schemas/config');
const EventEmitter = require('events').EventEmitter;

class WorkGroupManager extends EventEmitter {

  constructor(logger){
    super();
    this.logger = logger;
    this.nodeMap = {};
  }

  connect(callback){
    pm2.connect((err) => {

      if (err) {
        this.logger.log(['error'], { message: 'Could not communicate with PM2', error: err });
        return callback(err);
      }

      this.emit('connected');

      pm2.launchBus((err, bus) => {

        if (err){
          this.logger.log(['error'], { message: 'Failed to launch PM2 message bus.', error: err });
          return callback(err);
        }

        this.emit('bus-launched');

        this.logger.log(['info'], { message: 'PM2 Message Bus online.' });

        bus.on('process:msg', this.dispatchChildMessage.bind(this));

        callback();
      });
    });
  }

  static encode(nodeConfig){
    return (new Buffer(JSON.stringify(nodeConfig))).toString('base64');
  }

  static getProcessId(apps, nodeName){
    const app = _.find(apps, (a) => {
      return a.pm2_env.name === nodeName;
    });
    if (!app) return null;
    return app.pm2_env.pm_id;
  }

  static getWorkGroupName(launchConfig){
    if (launchConfig.name) return launchConfig.name;
    // Why are you launching this anyways?
    if (launchConfig.workers.length === 0) return `workgroup-${new Date().getTime()}`;
    return 'workgroup-' + launchConfig.workers.join(',');
  }

  dispatchChildMessage(packet){
    this.logger.log(['debug', packet.process.name], { message: 'Received message from a Workgroup Node.' });
    this.emit(packet.data.type || 'message', packet);
  }

  getLaunchConfig(nodeConfig){

    const launchConfig = _.merge({
      script: Path.resolve(__dirname, '../bin/kued-launch-node.js'),
      exec_mode: 'fork',
      restartDelay: 10000,
      maxMemoryRestart: '250M'
    }, nodeConfig.workgroup);

    launchConfig.name = WorkGroupManager.getWorkGroupName(launchConfig);
    launchConfig.args = [ 'run', WorkGroupManager.encode(nodeConfig) ];

    return launchConfig;
  }

  getWorkgroup(processIdOrName, callback){
    pm2.describe(processIdOrName, (err, processes) => {

      if (err){
        this.logger.log(['error'], { message: 'Could not retrieve Workgroup status.', error: err });
        return callback(err);
      }

      processes.forEach((process) => {
        if (this.nodeMap.hasOwnProperty(process.name)){
          process.config = this.nodeMap[process.name];
        }
      });

      callback(null, processes);
    });
  }

  getWorkgroups(callback){
    pm2.list((err, processes) => {

      if (err){
        this.logger.log(['error'], { message: 'Could not retrieve Workgroup statuses.', error: err });
        return callback(err);
      }

      const workgroupProcesses = _.filter(processes, (p) => {
        return this.nodeMap.hasOwnProperty(p.name);
      });

      workgroupProcesses.forEach((process) => {
        process.config = this.nodeMap[process.name];
      });

      callback(null, workgroupProcesses);
    });
  }

  resume(process, callback){
    pm2.start(process, this.handlePM2Response(callback));
  }

  stop(process, callback){
    pm2.stop(process, this.handlePM2Response(callback));
  }

  restart(process, callback){
    pm2.restart(process, this.handlePM2Response(callback));
  }

  kill(process, callback){
    pm2.delete(process, this.handlePM2Response(callback));
  }

  rotateLogs(callback){
    pm2.reloadLogs(this.handlePM2Response(callback));
  }

  launch(config, callback){

    const configCheck = Joi.validate(config, ConfigSchema);

    assert.ok(!configCheck.error, 'Invalid configuration: \n\n' + JSON.stringify(configCheck.error, null, 2));

    config = configCheck.value;

    const tasks = _.map(config.workgroups, (workgroup) => {
      return (next) => {
        const nodeConfig = _.merge(config, { workgroup });
        delete nodeConfig.workgroups;
        this.spawnNode(nodeConfig, next);
      };
    });

    async.parallel(tasks, (err) => {
      if (err){
        this.logger.log(['error'], { message: 'An error occurred launching one or more workers.', error: err });
        return callback(err);
      }
      callback();
    });
  }

  spawnNode(nodeConfig, callback){
    const launchConfig = this.getLaunchConfig(nodeConfig);

    pm2.start(launchConfig, (err, apps) => {
      if (err) {
        this.logger.log(['error'], { message: 'Failed to launch Worker Node.', error: err });
        return callback(err);
      }

      const processId = WorkGroupManager.getProcessId(apps, launchConfig.name);

      if (processId === null){
        callback(new Error(`Failed to capture process ID for ${launchConfig.name}`));
      }

      this.logger.log(['info'], { message: `WorkGroup Node ${launchConfig.name} started as PM2 process ${processId}` });

      this.nodeMap[launchConfig.name] = {
        processId,
        kued: nodeConfig
      };

      callback();
    });
  }

  disconnect(callback){
    pm2.disconnect((err) => {
      this.emit('disconnected');
      callback(err);
    });
  }

  handlePM2Response(callback){
    return (err) => {
      if (err){
        this.logger.log(['error'], { message: 'An error occurred executing PM2 action.', error: err });
        return callback(err);
      }
      callback();
    };
  }
}

module.exports = WorkGroupManager;