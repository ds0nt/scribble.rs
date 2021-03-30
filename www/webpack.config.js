const path = require('path');
 
module.exports = {
  target: 'web',
  devtool: 'source-map',
  entry: path.resolve(__dirname, './src/index.js'),
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  output: {
    path: path.resolve(__dirname, '../resources'),
    filename: 'game.js',
  },
};