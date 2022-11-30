var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

//load the config file(s)
var serverConfig = require('config');

var config = require('./utils/config')(serverConfig);

var sessionmgmt = require('./utils/sessionmgmt');
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var playerRouter = require('./routes/player');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var sess = {
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {}
};
//use secure cookies in production but not for dev
if (config.isProduction) {
    console.log('Using production cookies');
    //required if we're behind a reverse proxy for cookies
    app.set('trust proxy', 1);
    sess.cookie.secure = true;
}
app.use(session(sess));

app.get('/', sessionmgmt.isAuthenticated, indexRouter);
app.use('/player', sessionmgmt.isAuthenticated, playerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = !config.isProduction ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`);
});
