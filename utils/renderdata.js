var debug = require('debug')('tgrgbox:renderdata');
var nodeUrl = require('node:url');
var nodePath = require('node:path');


module.exports = function(config) {
    function makeStreamUrl(url, app, stream, file) {
        //debug('makeStreamUrl(%O, %O, %O, %O)', url, app, stream, file);
        var path = file ? nodePath.join(app, stream, file) : nodePath.join(app, stream);
        //debug('makeStreamURL returning %O', new URL(path, url).href);
        return new URL(path, url).href;
    }

    function buildDataForStream(session, streamName = config.channels[0].name) {
        //make a map of sources from the config
        var sources = new Map(config.channels.map( (channel) => {
            var sources = Array.from(config.urls.values()).map( (url) => ({ 'label': url.name,
                'type': url.protocol,
                'file': makeStreamUrl(url.url, channel.app, channel.stream, url.file)}));
            return [ channel.name, {
                'key': channel.name,
                'title': channel.title,
                'sources': sources,
                'streamKey': channel.streamKey
            } ];
        }));

        var source = sources.get(streamName);
        if (!source) {
            debug("Sending 404 for %O", streamName);
            return undefined;
        }

        var data = { 'renderData' : {
            'userid': session.userid,
            'username': session.username,
            'photoUrl': session.photoUrl,
            'siteName': config.siteName,
            'defaultChannelTitle': sources.get(config.channels[0].name).title,
            'source': source,
            'channels' : config.channels.map( (channel) => ({'name': channel.name, 'title': channel.title, 'streamKey': channel.streamKey}) ),
            'streamers' : config.streamers,
        } };
        debug('player.js data is %O', data);
        return data;
    }
    return buildDataForStream;
}

