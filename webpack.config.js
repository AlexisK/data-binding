const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const env = {
    devServer: {
        host: 'localhost',
        port: 3000
    }
};
const proxyRules = {
};


module.exports = {
    entry: './src/app.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.js'
    },
    devServer: {
        host: env.devServer.host || 'localhost',
        port: env.devServer.port || 3000,
        open: true,
        inline: true,
        historyApiFallback: true,
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        },
        proxy: proxyRules
    },
    plugins: [new HtmlWebpackPlugin({
        template: './src/index.html'
    })]
};
