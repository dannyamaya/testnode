var oauth2orize = require('oauth2orize');
var server = oauth2orize.createServer();
var url = require('url');
var passport = require('passport');

var Application = require('../models/application.js');

module.exports = {

    token: function(req, res ,next){
        passport.authenticate('bearer', { session: false }),
        function(req, res, next) {
            // ... Here we can do all sorts of cool things ...

            res.json(req.user);
        }
    },

    start: function (req, res, next) {
        server.authorize(function (applicationID, redirectURI, done) {
            Application.findOne({oauth_id: applicationID}, function (error, application) {
                if (application) {
                    var match = false, uri = url.parse(redirectURI || '');
                    for (var i = 0; i < application.domains.length; i++) {
                        if (uri.host == application.domains[i] || (uri.protocol == application.domains[i] && uri.protocol != 'http' && uri.protocol != 'https')) {
                            match = true;
                            break;
                        }
                    }

                    if (match && redirectURI && redirectURI.length > 0) {
                        done(null, application, redirectURI);
                    } else {
                        done(new Error("You must supply a redirect_uri that is a domain or url scheme owned by your app."), false);
                    }
                } else if (!error) {
                    done(new Error("There is no app with the client_id you supplied."), false);
                } else {
                    done(error);
                }
            });
        }), function (req, res) {

            var scopeMap = {
                view_account: 'view your account',
                edit_account: 'view and edit your account',
            };

            res.render('oauth', {
                transaction_id: req.oauth2.transactionID,
                currentURL: req.originalUrl,
                response_type: req.query.response_type,
                errors: req.flash('error'),
                scope: req.oauth2.req.scope,
                application: req.oauth2.client,
                user: req.user,
                map: scopeMap
            });
        }
    },
    finish: function (req, res, next) {
        if (req.user) {
            next();
        } else {
            passport.authenticate('local', {
                session: false
            }, function (error, user, info) {
                if (user) {
                    next();
                } else if (!error) {
                    req.flash('error', 'Your email or password was incorrect. Try again.');
                    res.redirect(req.body['auth_url'])
                }
            })(req, res, next);
        }
        server.decision(function (req, done) {
            done(null, {scope: req.oauth2.req.scope});
        })
    },

    exchange: function (req, res, next) {
        var appID = req.body['client_id'];
        var appSecret = req.body['client_secret'];

        Application.findOne({oauth_id: appID, oauth_secret: appSecret}, function (error, application) {
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
        server.token(), server.errorHandler();
    },

    login: function (req, res, next) {
        res.render('login', {
            title: 'Login',
            logged: req.isAuthenticated()
        });
    },

    loginUser: function (req, res, next) {

        if (req.body.email === undefined || req.body.email === "") {
            return res.status(404).json({message: "Por favor ingrese un Email"});
        }
        if (req.body.password === undefined || req.body.password === "") {
            return res.status(404).json({message: "Por favor ingrese una Contraseña"});
        }

        passport.authenticate('local', function (err, user, message) {

            if (err) {
                return res.status(500).json({message: 'Ha sucedido un error. Por favor intentelo nuevamente!'});
            }

            if (!user) {
                return res.status(400).json({message: message.message});
            }

            req.login(user, {}, function (err) {

                if (err) {
                    console.log(err);
                    return res.status(500).json({message: err.message});
                } else {
                    return res.json(
                        {
                            user: {
                                id: req.user.id,
                                email: req.user.email,
                                name: req.user.name,
                                rol: req.user.rol
                            },
                            success: true
                        });
                }
            });
        })(req, res);
    }

}


