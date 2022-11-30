var express = require('express');
var router = express.Router();

/* log out */
router.get('/', function(req, res, next) {
    req.session.destroy();
    res.render('logout', { title: 'Express' } );
});

module.exports = router;
