var LocalStrategy  = require('passport-local').Strategy;
var User = require('../models/user');
var config = require('./config');

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
    // LOCAL LOGIN =============================================================
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
    // AUTHORIZATION ===========================================================
    // =========================================================================

    server.grant(oauth2orize.grant.code({
      scopeSeparator: [ ' ', ',' ]
    }, function(application, redirectURI, user, ares, done) {
      var grant = new GrantCode({
        application: application,
        user: user,
        scope: ares.scope
      });
      grant.save(function(error) {
        done(error, error ? null : grant.code);
      });
    }));
    server.exchange(oauth2orize.exchange.code({
      userProperty: 'app'
    }, function(application, code, redirectURI, done) {
      GrantCode.findOne({ code: code }, function(error, grant) {
        if (grant && grant.active && grant.application == application.id) {
          var token = new AccessToken({
            application: grant.application,
            user: grant.user,
            grant: grant,
            scope: grant.scope
          });
          token.save(function(error) {
            done(error, error ? null : token.token, null, error ? null : { token_type: 'standard' });
          });
        } else {
          done(error, false);
        }
      });
    }));
    server.serializeClient(function(application, done) {
      done(null, application.id);
    });
    server.deserializeClient(function(id, done) {
      Application.findById(id, function(error, application) {
        done(error, error ? null : application);
      });
    });

};

