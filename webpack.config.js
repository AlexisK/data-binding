const path              = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack           = require("webpack");
const ExtractTextPlugin = require('extract-text-webpack-plugin');

var ROOT = path.resolve(__dirname);
function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [ROOT].concat(args));
}

const env        = {
    devServer : {
        host : 'localhost',
        port : 3000
    }
};
const proxyRules = {};

const sassLoaders = [
    'css-loader',
    'sass-loader?includePaths[]=' + [root('src', 'app_styles', 'globals')]
];

module.exports = function (env = {}) {
    let result = {
        entry  : './src/app.js',
        output : {
            path     : path.resolve(__dirname, 'dist'),
            filename : 'app.js'
        },

        resolveLoader : {
            alias : {
                'data-bind-loader' : path.join(__dirname, './loaders/data-bind-loader.js')
            }
        },

        resolve : {
            extensions : ['.js', '.json', '.scss'],
            modules    : [root('src'), 'node_modules', 'app_modules'],
            alias      : {
                core : root('src', 'core')
            }
        },

        module : {
            rules : [
                {
                    test    : /\.html$/,
                    loaders : [
                        'raw-loader',
                    ],
                    exclude : [/node_modules/, root('src/index.html')]
                },
                {
                    test    : /\.js$/,
                    loaders : [
                        'babel-loader?presets[]=es2015',
                        'data-bind-loader'
                    ],
                    exclude : [/node_modules/, root('src/app.js')]
                },
                {test : /\.json$/, loader : 'json-loader'},
                {test : /\.css$/, loaders : ['to-string-loader', 'css-loader']},
                {
                    test    : /\.scss$/,
                    loader  : ExtractTextPlugin.extract({
                        fallbackLoader : 'style-loader',
                        loader         : sassLoaders.join('!')
                    }),
                    exclude : /node_modules/,
                },
                {
                    test   : /\.(png|jpe?g|gif|svg|woff2?|ttf|eot|ico)$/,
                    loader : 'file?name=static/[name].[hash].[ext]?'
                }
            ]
        },

        devtool : 'source-map',

        devServer : {
            host               : 'localhost',
            port               : 3000,
            //open: true,
            inline             : true,
            historyApiFallback : true,
            watchOptions       : {
                aggregateTimeout : 300,
                poll             : 1000
            },
            proxy              : proxyRules
        },
        plugins   : [
            //new webpack.optimize.UglifyJsPlugin(),
            new ExtractTextPlugin("app.css"),
            new HtmlWebpackPlugin({
                template : './src/index.html'
            })
        ]
    };

    if ( env.mode === 'prod' ) {
        result.plugins.push(new webpack.optimize.UglifyJsPlugin());
    }

    return result;
};
