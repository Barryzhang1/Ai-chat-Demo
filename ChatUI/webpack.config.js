const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');
const fs = require('fs');

// 根据环境加载对应的 .env 文件
const currentPath = path.join(__dirname);
const envPath = currentPath + '/.env';
const envProductionPath = currentPath + '/.env.production';

// 如果是 production 模式且 .env.production 存在，使用它；否则使用 .env
const finalPath = process.env.NODE_ENV === 'production' && fs.existsSync(envProductionPath)
  ? envProductionPath
  : (fs.existsSync(envPath) ? envPath : null);

// 加载环境变量
if (finalPath) {
  const envVars = dotenv.config({ path: finalPath }).parsed || {};
  // 将环境变量设置到 process.env 中
  Object.keys(envVars).forEach(key => {
    process.env[key] = envVars[key];
  });
}

module.exports = {
  entry: './src/index.js',
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less$/i,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images',
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'fonts',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "process": require.resolve("process/browser"),
      "buffer": require.resolve("buffer/"),
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      // 注入 process.env 对象
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || 'production',
        REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
        REACT_APP_GAME_URL: process.env.REACT_APP_GAME_URL || 'http://localhost:3002',
        REACT_APP_NAME: process.env.REACT_APP_NAME || '点餐系统',
      }),
      // 同时提供 process 的 browser 版本
      'process.browser': true,
      'process.version': JSON.stringify(process.version),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    host: '0.0.0.0',
    port: 3000,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
};