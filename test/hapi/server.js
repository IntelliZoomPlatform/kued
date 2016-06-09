'use strict';

const _ = require('lodash');
const Hapi = require('hapi');
const Good = require('good');
const Blipp = require('blipp');
const KuedPlugin = require('../../lib/integrations/hapi');

const server = new Hapi.Server();

server.connection({ port: 3000 });

const workers = require('../integration/workers.json');

const imqProvider = _.find(workers.providers, (provider) => {
  return provider.provides === 'imq';
});

if (!process.env.IMQ_TOKEN || !process.env.IMQ_PROJECT_ID)
  throw new Error('Environment variables IMQ_TOKEN and IMQ_PROJECT_ID must be set.');

imqProvider.token = process.env.IMQ_TOKEN;
imqProvider.project_id = process.env.IMQ_PROJECT_ID;

const plugins = [
  { register: Good, options: {
      reporters: {
        console: [{
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [{
            log: '*',
            response: '*'
          }]
        }, {
          module: 'good-console'
        }, 'stdout']
      }
    }
  },
  { register: Blipp, options: {} },
  { register: KuedPlugin, options: workers }
];

server.register(plugins, (err) => {

  if (err) throw err;

  server.start((err) => {

    if (err) throw err;

    console.log('Server running at:', server.info.uri);
  });

});