'use strict';
var webpack = require("webpack");
var path = require("path");

module.exports = {
  entry: ['babel-polyfill','./src/app.js'],
  output: {
        path: path.resolve("build/assets"),
        filename: "bundle.js",
        publicPath: path.resolve("build/assets")+'/'
      },
  plugins:[new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production')
  }
 }),
 new webpack.optimize.UglifyJsPlugin()] ,   
  module: {
      loaders: require('./loaders.config')
  }
}
