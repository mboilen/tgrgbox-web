var querystring = require('querystring');
const { copy } = require('../routes');
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

function createUser(profile) {
    return {
        //in Discord the username does not have the discriminator.
        user: profile.displayName,
        userid: profile.username,
        photoUrl: profile.photos.find( (photo) => photo.primary)?.value
    };
}
function copyUserToSession(session, user) {
    session.user = user.user;
    session.userid = user.userid;
    session.photoUrl = user.photoUrl;
}

module.exports.isAuthenticated = isAuthenticated;
module.exports.createUser = createUser;
module.exports.copyUserToSession = copyUserToSession;
