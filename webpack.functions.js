const path = require('path');
const fs = require('fs');
const Dotenv = require('dotenv-webpack');


const funcDir = path.join(__dirname, 'src', 'functions');
const functions = fs.readdirSync(funcDir).map(f => f.match(/(.*)\.js$/)[1] ).reduce((obj, f)=>{
  obj[f] = path.join(funcDir, f);
  return obj;
}, {});

const opts = {
  target: 'node',
  entry: functions,
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'functions'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: [ 
          { loader: 'eslint-loader' }
        ]
      },
    ]
  },
  plugins: process.env.NODE_ENV==="production" ? [] : [ new Dotenv() ]
};

const envOpts = process.env.NODE_ENV==="production" ? { mode: "production" } : { mode: "development", devtool: 'eval-source-map' };

module.exports = Object.assign(opts, envOpts);
