'use strict';

const commandLineArgs = require('command-line-args');
const csfd = require('csfd');
const imdb = require('imdb-node-api');
const youtube = require('youtube-search');
const config = require('./config.js');
const chalk = require('chalk');
const _ = require('lodash');
const async = require('async');
const Multispinner = require('multispinner');
const spinnersConfig = ['csfd', 'imdb', 'youtube'];

const options = commandLineArgs([{
    name: 'search',
    alias: 's',
    type: String,
    multiple: true,
    defaultOption: true
}]);

const search = _.trim(_.isArray(options.search) ? _.join(options.search, ' ') : options.search);

if (_.isNil(search)) {
    console.log(`${chalk.red(`Error`)}: Please use: node index.js "Movie name" `);
    process.exit(1);
}

const spinners = new Multispinner(spinnersConfig);

async.parallel({

    csfd: (callback) => {

    csfd.searchMovie(search).then((result) => {

        spinners.success('csfd');

if (_.size(result) === 0) {
    return callback();
}

callback(null, _.slice(_.map(result, (row) => {

    return {
        source: 'csfd',
        title: _.get(row, 'title'),
        url: _.get(row, 'url')
    };

}), 0, 5));

}).catch((error) => {

    spinners.error('csfd');
return callback(error);

});

},

imdb: (callback) => {


    imdb.searchMovies(search, function(result) {

        spinners.success('imdb');

        if (_.size(result) === 0) {
            return callback();
        }

        callback(null, _.slice(_.map(result, (row) => {

            return {
                source: 'imdb',
                title: `${_.get(row, 'title')} (${_.get(row, 'year')})`,
                url: `https://www.imdb.com/title/${_.get(row, 'id')}/`
            };

    }), 0, 5));

    }, (error) => {

        spinners.error('imdb');
    return callback(error);
});


},

youtube: (callback) => {

    //Manual https://developers.google.com/youtube/v3/docs/search/list
    youtube(search, {
        maxResults: 5,
        key: config.youtube,
        order: 'relevance'
    }, (error, result) => {

        if (error) {
            spinners.error('youtube');
            return callback(error);
        }

        spinners.success('youtube');

    if (_.size(result) === 0) {
        return callback();
    }

    callback(null, _.map(result, (row) => {

        return {
            source: 'youtube',
            title: `${_.get(row, 'title')}`,
            url: `${_.get(row, 'link')}`
        };

}));

});

}

}, (error, results) => {


    spinners.on('done', () => {

        _.map(results, (method) => {

            _.map(method, (row) => {

                if (row.source === 'csfd') {
        console.log(`[${chalk.yellow(row.source)}]: ${row.title} - ${chalk.cyan(row.url)}`);
    }

    if (row.source === 'imdb') {
        console.log(`[${chalk.magenta(row.source)}]: ${row.title} - ${chalk.cyan(row.url)}`);
    }

    if (row.source === 'youtube') {
        console.log(`[${chalk.red(row.source)}]: ${row.title} - ${chalk.cyan(row.url)}`);
    }

});

});

    process.exit(1);

});

    spinners.on('err', () => {
        console.log(`${chalk.red(`Error`)}: No work no fun `);
    process.exit(1);
});

});
