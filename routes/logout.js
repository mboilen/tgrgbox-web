var express = require('express');
var router = express.Router();

/* log out */
router.get('/', function(req, res, next) {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.render('logout', { title: 'Logout' } );
});

module.exports = router;
