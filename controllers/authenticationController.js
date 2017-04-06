var oauth2orize = require('oauth2orize');
var url = require('url');
var passport = require('passport');

module.exports = {

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
    },

    logout: function (req,res,next){
        req.logout();
        res.redirect('/');
    }

}


