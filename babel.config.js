module.exports = {
  presets: [
    ["@babel/preset-react", {
      "runtime": "automatic" // This automatically imports React when needed
    }],
    "@babel/preset-env"
  ]
};