const debug = require('debug')('tgrgbox:omeapi');
var express = require('express');
var router = express.Router();
var nodeUrl = require('node:url');
var nodePath = require('node:path');


module.exports = function(config) {
    const defaultStreamTime = 24 * 60 * 60 * 1000; //24 hours, in msec
    router.post('/', function(req, res, next) {
        //for rtmp, take the stream key and remap it to the stream name with new_url
        debug("Post headers are %O", req.headers);
        debug("Post body is %O", req.body);
        var apireq = req.body;
        debug("Parsed body");
        var response;
        var response = {};
        if (apireq.request.direction == 'incoming') {
            //incoming requests are for RTMP and WebRTC.  Validate that the last last part
            //of the url is the stream key and replace it with the stream name 
            var url = new URL(apireq.request.url);
            var streamKey = nodePath.basename(url.pathname);
            var streamName = nodePath.dirname(url.pathname);
            var channel = config.channels.find((channel) => channel.streamKey === streamKey);
            if (channel) {
                response.allowed = true;
                response.lifetime = defaultStreamTime;

                url.pathname = nodePath.join(streamName, channel.stream);
                response.new_url = url.href;
            } else {
                response.allowed = false;
                response.reason = 'Stream key ' + streamKey + 'was not found in config';
            }

        } else {
            //for outgoing requests, verify that the url contains the stream key as a query paramter
            var url = new URL(apireq.request.url);
            var streamSecret = url.searchParams.get('streamSecret');
            var response = {};
            if (streamSecret == config.streamSecret) {
                response.allowed = true;
                //remove the stream key and redirect
                url.searchParams.delete('streamSecret');
                debug('searchParams are %O', url.searchParams);
                response.new_url = url.href;
                response.lifetime = defaultStreamTime;
            } else {
                response.allowed = false;
                response.reason = 'Stream key for playback didn\'t match';
            }
        }
        debug('API Response: %O', response);
        res.json(response);
    });
    return router;
}
