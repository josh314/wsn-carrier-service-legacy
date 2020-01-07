const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));


const scripts = {};
const getScripts = (dir, base) => {
  const dirents = fs.readdirSync( path.join(base, dir), { withFileTypes: true } );
  dirents.map( de => {
    if( de.isDirectory() ) {
      getScripts(de.name, path.join(base, dir));
    }
    else {
      const name = de.name;
      const match = name.match(/(.*)\.(js|ts)$/);
      if(match && match[1]) {
        scripts[path.join(base, dir, match[1])] = path.join( process.cwd() , base, dir, name);
      }
    }
  });
}

// Go into the src dir to run the getScripts function. Then back out again to proceed with the rest of webpack eval
process.chdir('src');
getScripts('scripts', '.');
process.chdir('..');

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
    path: path.join(__dirname, 'build'),
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
