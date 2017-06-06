/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize')
  , passport = require('passport');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  Application.findById(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {

  var grant = new GrantCode({
    application: client,
    user: user,
    scope: ares.scope
  });

  grant.save(function(err, g) {
    if (err) { return done(err); }
    done(error, error ? null : g.code);
  });
}));

// Grant implicit authorization.  The callback takes the `client` requesting
// authorization, the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a token, which is bound to these
// values.

server.grant(oauth2orize.grant.token({
    scopeSeparator: [ ' ', ',' ]
  },function(client, user, ares, done) {
      var grant = new GrantCode({
        application: client,
        user: user,
        scope: ares.scope
      });

      grant.save( function(err) {
          if (err) { return done(err); }
          done(null, grant.code);
      });
  }));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code({
    userProperty: 'app'
  },function(client, code, redirectURI, done) {

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

