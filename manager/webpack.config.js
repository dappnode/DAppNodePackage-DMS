const path = require("path");
const { NODE_ENV = "production" } = process.env;
module.exports = {
  entry: "./src/index.ts",
  mode: NODE_ENV,
  target: "node",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"]
      }
    ]
  },
  optimization: {
    // Minimization does not provide great disk space savings, but reduces debug capacity
    minimize: false
  },
  devtool: "source-map"
};
