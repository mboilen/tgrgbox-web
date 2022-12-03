var debug = require('debug')('tgrgbox:renderdata');
var nodeUrl = require('node:url');
var nodePath = require('node:path');


module.exports = function(config) {
    function makeStreamUrl(url, app, stream, file) {
        //debug('makeStreamUrl(%O, %O, %O, %O)', url, app, stream, file);
        var path = file ? nodePath.join(app, stream, file) : nodePath.join(app, stream);
        var streamUrl = new URL(path, url);
        //add the stream key
        streamUrl.searchParams.append('streamSecret', config.streamSecret);
        //debug('makeStreamURL returning %O', streamUrl);
        return streamUrl.href;
    }

    function makeRtmpUrl(url, app, streamkey) {
        return new URL(app, url).href;
    }

    function makeSrtUrl(url, app, streamkey) {
        //SRT urls are crazy:
        //
        //srt://host:port?streamid=[srt://host:port/app/stream]
        //
        //the part in the brackets is url encoded (with percents)

        var path = nodePath.join(app, streamkey);
        var streamid = new URL(path, url).href;
        var srtUrl = new URL(url);
        srtUrl.searchParams.append('streamid', encodeURI(streamid));
        return srtUrl.href;
    }

    function buildDataForStream(session, streamName = config.channels[0].name) {
        debug('session in buildDataForStream is %O', session);
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
            'username': session.user,
            'photoUrl': session.photoUrl,
            'siteName': config.siteName,
            'defaultChannelTitle': sources.get(config.channels[0].name).title,
            'source': source,
            'channels' : config.channels.map( (channel) => ({
                'name': channel.name,
                'title': channel.title,
                'streamKey': channel.streamKey,
                'rtmp' : makeRtmpUrl(config.ingest.rtmp, channel.app, channel.streamKey),
                'srt' : makeSrtUrl(config.ingest.srt, channel.app, channel.streamKey)
            })),
            'streamers' : config.streamers,
        } };
        debug('player.js data is %O', data);
        return data;
    }
    return buildDataForStream;
}

