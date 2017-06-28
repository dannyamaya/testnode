var oauth2orize = require('oauth2orize');
var url = require('url');
var passport = require('passport');
var userController = require('./userController.js')


module.exports = {

    login: function (req, res, next) {
        res.render('login', {
            title: 'Login',
            logged: req.isAuthenticated()
        });
    },

    loginUser: function (req, res, next) {

        if (req.body.email === undefined || req.body.email === "") {
            return res.status(404).json({message: "Please enter an Email"});
        }
        if (req.body.password === undefined || req.body.password === "") {
            return res.status(404).json({message: "Please enter a password"});
        }

        passport.authenticate('local', function (err, user, message) {

            if (err) {
                return res.status(500).json({message: 'Something is wrong try later.'});
            }

            if (!user) {
                return res.status(400).json({message: message.message});
            }

            if(user.active == 'false'){
                return res.status(400).json({message: 'User not found'});
            }

            req.login(user, {}, function (err) {

                if (err) {
                    console.log(err);
                    return res.status(500).json({message: err.message});
                } else {
                    userController.updateLastLogin(req.user.id);
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
    },

    logout: function (req,res,next){
        req.logout();
        res.redirect('/');
    }

}


