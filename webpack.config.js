const path = require("path");
const webpack = require("webpack");
const uglify = require("uglifyjs-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  entry: "./src/index.js", //入口文件，就是在src目录下的index.js文件，
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, "./dist"), //输出路径dist目录
    publicPath: "/dist/",
    filename: "index.min.js",
    libraryTarget: "umd", // CMD 仅NODE，AMD仅浏览器，UMD同时支持
    // 　libraryTarget：为了支持多种使用场景，我们需要选择合适的打包格式。libraryTarget 属性。这是可以控制 library 如何以不同方式暴露的选项。
    umdNamedDefine: true
  },
  //这里我们可以剔除掉一些通用包,自己的包不打包这些类库,需要用户环境来提供
  externals: {
    vue: "vue"
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader"
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "scss-loader"
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader" //babel的相关配置在.babelrc文件里
      },
      {
        test: /\.(png|jpg|gif|ttf|svg|woff|eot)$/,
        loader: "url-loader",
        query: {
          limit: 30000 //把一些小图片打包为base64
        }
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true, // Must be set to true if using source-maps in production
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        }
      }),
    ],
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};