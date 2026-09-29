const path = require('path');

module.exports = {
  // Entry point for the app
  entry: './src/index.js',  // Update this if your entry point is different

  // Output directory
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },

  // Add your rule to ignore specific source map warnings
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/html2pdf\.js/  // This will ignore warnings for html2pdf.js
        ],
      },
    ],
  },

  // Optional: Ignore other specific warnings
  ignoreWarnings: [
    {
      module: /html2pdf\.js/,
    },
  ],

  // Development mode or production mode
  mode: 'development',  // Use 'production' for production builds
};
