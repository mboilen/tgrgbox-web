const debug = require('debug')('tgrgbox:config');
var express = require('express');
var router = express.Router();
var nodeUrl = require('node:url')
var nodePath = require('node:path')

//TOOD: I need a file for hls but not for webrtc
function makeStreamUrl(url, app, stream, file) {
    //debug('makeStreamUrl(%O, %O, %O, %O)', url, app, stream, file);
    var path = file ? nodePath.join(app, stream, file) : nodePath.join(app, stream);
    //debug('makeStreamURL returning %O', new URL(path, url).href);
    return new URL(path, url).href;
}

module.exports = function(config) {
    debug("Player config is %O", config);
    //make a map of sources from the config
    var sources = new Map(config.channels.map( (channel) => {
        var sources = Array.from(config.urls.values()).map( (url) => ({ 'label': url.name,
            'type': url.protocol,
            'file': makeStreamUrl(url.url, channel.app, channel.stream, url.file)}));
        return [ channel.name, {
            'key': channel.name,
            'title': channel.title,
            'sources': sources
        } ];
    }));

    var data = {
            title: sources.get(config.channels[0].name).title,
            'sources': sources,
            'defaultSource': config.channels[0].name
    };
    debug('player.js data is %O', data);
    /* GET player. */
    router.get('/', function(req, res, next) {
        res.render('player', data);
    });
    return router;
}
