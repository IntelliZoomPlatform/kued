'use strict';

const Hapi = require('hapi');
const Good = require('good');
const Blipp = require('blipp');
const KuedPlugin = require('../../lib/integrations/hapi');

const server = new Hapi.Server();

server.connection({ port: 3000 });

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
  { register: KuedPlugin, options: require('../integration/workers.json') }
];

server.register(plugins, (err) => {

  if (err) throw err;

  server.start((err) => {

    if (err) throw err;

    console.log('Server running at:', server.info.uri);
  });

});