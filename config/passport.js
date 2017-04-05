var LocalStrategy  = require('passport-local').Strategy;
var PassportOAuthBearer = require('passport-http-bearer');
var User = require('../models/user');
var config = require('./config');
var oauth2orize = require('oauth2orize');
var server = oauth2orize.createServer();


module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });


    // =========================================================================
    // LOCAL STRATEGY ==========================================================
    // =========================================================================

    passport.use(new LocalStrategy({
       usernameField: 'email'
    },function(email, password, done) {
        User.authenticate(email, password,
            function(err, user, message) {
                return done(err, user, message)
            });
    }));


    // =========================================================================
    // ACCESS TOKEN STRATEGY ===================================================
    // =========================================================================

    var accessTokenStrategy = new PassportOAuthBearer(function(token, done) {
      AccessToken.findOne({ token: token }).populate('user').populate('grant').exec(function(error, token) {
        if (token && token.active && token.grant.active && token.user) {
          done(null, token.user, { scope: token.scope });
        } else if (!error) {p
          done(null, false);
        } else {
          done(error);
        }
      });
    });

    passport.use(accessTokenStrategy);

};

