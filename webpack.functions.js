const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const funcDir = path.join(__dirname, 'src', 'functions');
const functions = fs.readdirSync(funcDir).map(f => f.match(/(.*)\.js$/)[1] ).reduce((obj, f)=>{
  obj[f] = path.join(funcDir, f);
  return obj;
}, {});


plugins = [
  new webpack.DefinePlugin({
    'APP_VERSION': JSON.stringify(packageJson.version),
  })
];

if(process.env.NODE_ENV!=="production") {
  plugins.push( new Dotenv() );
}

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
        resolve: {
          modules: [
            path.resolve('src/lib'),
            'node_modules'
          ]
        },
        use: [ 
          { loader: 'eslint-loader' }
        ]
      },
    ]
  },
  plugins: plugins,
};

const envOpts = process.env.NODE_ENV==="production" ? { mode: "production" } : { mode: "development", devtool: 'eval-source-map' };

module.exports = Object.assign(opts, envOpts);
