var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/auth/start', );

router.post('/auth/finish', function(req, res, next) {
  if (req.user) {
    next();
  } else {
    passport.authenticate('local', {
      session: false
    }, function(error, user, info) {
      if (user) {
        next();
      } else if (!error) {
        req.flash('error', 'Your email or password was incorrect. Try again.');
        res.redirect(req.body['auth_url'])
      }
    })(req, res, next);
  }
}, server.decision(function(req, done) {
  done(null, { scope: req.oauth2.req.scope });
}));

router.post('/auth/exchange', function(req, res, next){
  var appID = req.body['client_id'];
  var appSecret = req.body['client_secret'];

  Application.findOne({ oauth_id: appID, oauth_secret: appSecret }, function(error, application) {
    if (application) {
      req.app = application;
      next();
    } else if (!error) {
      error = new Error("There was no application with the Application ID and Secret you provided.");
      next(error);
    } else {
      next(error);
    }
  });
}, server.token(), server.errorHandler());

module.exports = router;
