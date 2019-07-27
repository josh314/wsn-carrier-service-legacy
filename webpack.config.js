const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: "production",
  entry: {
    // js bundles
    app: path.join(__dirname, 'src', 'index.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
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
    port: 8080,
    proxy: {
      '/version': 'http://localhost:9000/',
      '/products': 'http://localhost:9000/',
      // '/products/favicon.ico': 'http://localhost:8080/favicon.ico'
    }
  }
};