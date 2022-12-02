const debug = require('debug')('tgrgbox:config');
var express = require('express');
var router = express.Router();


module.exports = function(config) {
    var renderData = require('../utils/renderdata')(config);
    debug("Player config is %O", config);

    /* GET player. */
    router.get('/', function(req, res, next) {
        var data = renderData(req.session.user, config.channels[0].name);
        debug('player.js data is %O', data);
        res.render('player', { 'data': data });
    });
    router.get('/:stream', function(req, res, next) {
        debug("Got stream name %O", req.params);
        var data = renderData(req.session.user, req.params.stream);
        if (!data) {
            res.status(404).send("Cannot find stream " + req.params.stream);
            return;
        }
        debug('player.js data is %O', data);
        res.render('player', data);
    });
    return router;
}
