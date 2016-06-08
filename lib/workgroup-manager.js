'use strict';

const _ = require('lodash');
const pm2 = require('pm2');
const async = require('async');
const assert = require('assert');
const Path = require('path');
const Joi = require('joi');
const ConfigSchema = require('./schemas/config');

class WorkGroupManager {

  constructor(logger){
    this.logger = logger;
    this.nodeMap = {};
  }

  connect(callback){
    pm2.connect((err) => {

      if (err) {
        this.logger.log(['error'], { message: 'Could not communicate with PM2', error: err });
        return callback(err);
      }

      pm2.launchBus((err, bus) => {

        if (err){
          this.logger.log(['error'], { message: 'Failed to launch PM2 message bus.', error: err });
          return callback(err);
        }

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
    this.logger.log(['info'], { message: 'Received message from a Workgroup Node.', data: packet });
  }

  getLaunchConfig(nodeConfig){

    const launchConfig = _.merge({
      script: Path.resolve(__dirname, '../bin/kued-launch-node.js'),
      exec_mode: 'fork'
    }, nodeConfig.workgroup);

    launchConfig.name = WorkGroupManager.getWorkGroupName(launchConfig);
    launchConfig.args = [ 'run', WorkGroupManager.encode(nodeConfig) ];

    return launchConfig;
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

      this.nodeMap[launchConfig.name] = processId;

      callback();
    });
  }

  disconnect(callback){
    pm2.disconnect(callback);
  }

}

module.exports = WorkGroupManager;