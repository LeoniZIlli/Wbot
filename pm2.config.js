module.exports = {
    apps: [{
      name: 'wbot',
      script: './dist/index.js',
      node_args: '-r dotenv/config'
    }]
  };
  