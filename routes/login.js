var express = require('express');
var router = express.Router();

//Handle oauth2 login to discord
router.get('/', function(req, res, next) {
    console.log('in login router');
    req.session.regenerate(function (err) {
        console.log('in regenerate');
        if (err) next(err);
        console.log('setting user');
        req.session.user = 'testuser';
        console.log('saving');
        req.session.save(function (err) {
            console.log('in save');
            if (err) return next(err);
            console.log('redirecting, param is ' + req.query.redirect);
            if (req.query.redirect) {
                res.redirect(req.query.redirect);
            } else {
                res.redirect('/');
            }
        });
        console.log('save over');
    });
});

module.exports = router;
