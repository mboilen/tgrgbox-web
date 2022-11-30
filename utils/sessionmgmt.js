var querystring = require('querystring');
function isAuthenticated(req, res, next) {
    console.log('In isAuthenticated ' + JSON.stringify(req.session));
    console.log('In isAuthenticated ' + req.session.user);
    if (req.session.user) {
        next();
    } else {
        console.log("original URL is " + req.originalUrl);
        res.redirect('/login?redirect=' + querystring.escape(req.originalUrl));
    }
}


module.exports.isAuthenticated = isAuthenticated;
