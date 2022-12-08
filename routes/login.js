var debug = require('debug')('tgrgbox:login')
var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
var passport = require('passport');
var DiscordStrategy = require('@oauth-everything/passport-discord').Strategy;

var scopes = ['identify'];
var prompt = 'consent';

module.exports = function(app, sessionmgmt, config) {
    //setup Discord auth
    passport.use(new DiscordStrategy({
            'clientID': config.discord.clientId,
            'clientSecret': config.discord.clientSecret,
            'callbackURL': config.discord.callbackUrl,
            'scopes': scopes,
            'prompt': prompt
        },
        function (accessToken, refreshToken, profile, cb) {
            debug("cb accessToken: %O", accessToken);
            debug("cb refreshToken: %O", refreshToken);
            debug("cb cb: %O", cb);
            if (profile && profile.displayName) {
                cb(null, profile);
            } else {
                cb('No profile found');
            }
        }
    ));
    passport.serializeUser(function(user, cb) {
        debug("serializeUser: %O", user);
        var session = sessionmgmt.createUser(user);
        debug('serializeUser session: %O', session);
        return cb(null, session);
    });
    passport.deserializeUser(function(user, cb) {
        debug("deserializeUser: %O", user);
        return cb(null, user);
    });
    app.use(passport.initialize());
    app.use(passport.session());
    //Handle oauth2 login to discord
    router.get('/', function (req, res, next) {
        if (req.session.user) {
            debug('found existing session');
            res.redirect('/');
        } else {
            debug('calling discord oauth');
            passport.authenticate('discord', function(err, user, info) {
                debug('err: %O', err);
                debug('user: %O', user);
                debug('info: %O', info);
                req.login(user, next);
            })(req, res, next);
        }
    },
    );
    router.get('/_oauth', passport.authenticate('discord', { failureRedirect: '/login/error', failureMessage: true}),
        function(req, res) {
            debug('_oauth headers %O', req.headers);
            req.session.regenerate(function (err) {
                debug('in regenerate');
                if (err) next(err);
                debug('Session when saving is %O', req.user);
                debug('Setting session');
                sessionmgmt.copyUserToSession(req.session, req.user);
                debug('saving');
                req.session.save(function (err) {
                    debug('in save');
                    if (err) return next(err);
                    debug('redirecting, param is ' + req.query.redirect);
                    if (req.query.redirect) {
                        res.redirect(req.query.redirect);
                    } else {
                        res.redirect('/');
                    }
                });
                debug('save over');
            });
            //debug('redirecting %O', req.user);
            //res.redirect('/login/info');
        }
    );

    router.get('/info', function(req, res, next) {
        if (!req.isAuthenticated()) {
            debug('unauthenticated user in /info');
            debug('user is %O', req.user);
            req.session.destroy();
            res.clearCookie('connect.sid');
            res.redirect('/login/error');
        } else {
            if (!config.users.has(req.user.userid)) {
                console.log('Unauthorized user ' + req.user.userid);
                //This user has a discord account but isn't authorized for the service.
                var user = req.user.userid;
                req.session.destroy();
                res.clearCookie('connect.sid');
                res.render('unauthorized', {'username': user});
                return;
            }
            req.session.regenerate(function (err) {
                debug('in regenerate');
                if (err) next(err);
                debug('Session when saving is %O', req.user);
                debug('Setting session');
                sessionmgmt.copyUserToSession(req.session, req.user);
                debug('saving');
                req.session.save(function (err) {
                    debug('in save');
                    if (err) return next(err);
                    debug('redirecting, param is ' + req.query.redirect);
                    if (req.query.redirect) {
                        res.redirect(req.query.redirect);
                    } else {
                        res.redirect('/');
                    }
                });
                debug('save over');
            });
        }
    });
    router.get('/error', function(req, res, next) {
        debug('login error: %O', req.params);
        debug('login session: %O', req.session);
        res.render('loginerror');
    });
    return router;
}
