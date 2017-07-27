var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log4js = require('log4js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var commonUtil = require('./core/util/commonUtil');
var systemConfig = require(commonUtil.getConfigPath() + "/system_config");
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var redisClient = require("./core/util/RedisUtils");

var routes = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(log4js.connectLogger(log4js.getLogger("express")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session超时时间，单位：分钟
var timeout_minute = systemConfig.session_time_out_minute || 120;
app.use(session({
    secret: 'express',
    store: new RedisStore({
        client: redisClient.Redis,
        prefix: "admin_session_",
        ttl: timeout_minute * 60 // 过期时间
    }),
    resave: true,
    saveUninitialized: true
}));

app.use('/', routes);
app.use('/users', users);
app.use('/login', login);

app.use(function (req, res, next) {
    if (auth(req)) {
        res.render("login", {msg: '您未登录或登录已超时'});
        return;
    }
    next();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function auth(req) {
    if (req.url.indexOf("login") == -1
        && !req.session.user) {
        return true;
    }
    return false;
}

module.exports = app;