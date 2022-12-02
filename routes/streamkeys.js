const debug = require('debug')('tgrgbox:streamkeys');
var express = require('express');
var router = express.Router();

module.exports = function(config) {
    var renderData = require('../utils/renderdata')(config);
    debug('Player cconfig is %O', config);

    router.get('/', function(req, res, next) {
        var data = renderData(req.session.user);
        debug('render data is %O', data);
        res.render('streamkeys', data);
    });
    return router;
}
