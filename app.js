/**
 * Module dependencies.
 */
var express = require('express'),
    compression = require('compression'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session  = require('express-session'),
    mongoStore = require('connect-mongo')(session);

//Configuration file
var config = require('./config/config.json');


// -----------------------------------------------------------------
// Database
// -----------------------------------------------------------------

mongoose.connect(config.development.db, function(err, res) {
  if(err) {
    console.log('ERROR: connecting to Database. ' + err);
  } else {
    console.log('Connected to Mongo Database');
  }
});

// -----------------------------------------------------------------
// Express configuration
// -----------------------------------------------------------------

var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
app.use(compression({
  threshold: 512
}));
app.use(express.static(path.join(__dirname, 'public')));
app.disable('x-powered-by');



// Passport configuration
require('./config/auth');

//require(__dirname + '/config/passport.js')(passport, config);

// Routes
var index = require('./routes/index');
var users = require('./routes/users');
var tickets = require('./routes/tickets');
app.use('/', index);
app.use('/api/users', users);
app.use('/api/tickets', tickets);

// -----------------------------------------------------------------
// Error handling
// -----------------------------------------------------------------

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


// -----------------------------------------------------------------
// Start app
// -----------------------------------------------------------------
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function(){
  console.log("Listening on port " + app.get('port'));
});
