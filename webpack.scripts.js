const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const scriptsDir = path.join(__dirname, 'src', 'scripts');
const scripts = fs.readdirSync(scriptsDir).map(f => { const match = f.match(/(.*)\.(js|ts)$/); return match ? match[1] : null; }).reduce((obj, f)=>{
  if(f) {
    obj[f] = path.join(scriptsDir, f);
  }
  return obj;
}, {});


plugins = [
  new webpack.DefinePlugin({
    '__APP__': JSON.stringify(packageJson.name),
    '__VERSION__': JSON.stringify(packageJson.version),
  })
];

if(process.env.NODE_ENV!=="production") {
  plugins.push( new Dotenv() );
}

const opts = {
  target: 'node',
  entry: scripts,
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build', 'scripts'),
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
      {
        test: /\.ts$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          { loader: 'ts-loader' },
          { loader: 'eslint-loader' }
        ]
      },
       
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    modules: [
      path.resolve('src/lib'),
      'node_modules'
    ]
  },
  plugins: plugins,
};

const envOpts = process.env.NODE_ENV==="production" ? { mode: "production" } : { mode: "development", devtool: 'eval-source-map' };

module.exports = Object.assign(opts, envOpts);
