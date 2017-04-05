var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');
var config = require('./config/config.json');
require(__dirname + '/config/passport.js')(passport, config);

var index = require('./routes/index');
var users = require('./routes/users');
var tickets = require('./routes/tickets');
var session  = require('express-session');
var mongoStore = require('connect-mongo')(session);



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: config.cookie_secret,
    proxy: true,
    resave: true,
    saveUninitialized: true,
    store: new mongoStore({
        url: config.production.url,
        collection : 'sessions'
    })
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/api/users', users);
app.use('/api/tickets', tickets);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
