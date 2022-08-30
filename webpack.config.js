const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: "production",
  entry: {
    // js bundles
    app: path.join(__dirname, 'src', 'index.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build', 'dist'),
  },
  module: {
    rules: [
      {
        test: /client\/.*\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: [ 
          { loader: 'eslint-loader' }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      minify: true
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    historyApiFallback: true,
    port: 6001,
    proxy: {
      '/.netlify': {
        target: 'http://localhost:6000',
        pathRewrite: { '^/.netlify/functions': '' }
      }
    },
  }
};