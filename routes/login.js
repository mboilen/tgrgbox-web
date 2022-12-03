var debug = require('debug')('tgrgbox:login')
var express = require('express');
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
            //displayName contains the discriminator
            if (config.users.has(profile.displayName)) {
                debug('found user: %O', profile.username);
                cb(null, profile);
            } else {
                debug('unauthorized user: %O', profile.displayName);
                cb(null, false);
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
            passport.authenticate('discord')(req, res, next);
        }
    },
    );
    router.get('/_oauth', passport.authenticate('discord', {failureRedirect: '/login/error'}),
        function(req, res) {
            debug('redirecting to /info');
            res.redirect('/login/info');
        }
    );
        /*
        req.session.regenerate(function (err) {
            debug('in regenerate');
            if (err) next(err);
            debug('setting user');
            req.session.user = 'testuser';
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
        */
    router.get('/info', function(req, res, next) {
        if (!req.isAuthenticated()) {
            debug('unauthenticated user in /info');
            res.redirect('/login/error');
        }
        debug('got auth %O', req.user);
        debug('got auth %O', req.session);
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
    });
    router.get('/error', function(req, res, next) {
        debug('login error');
        res.render('loginerror');
    });
    return router;
}
