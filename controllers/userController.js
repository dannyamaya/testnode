var mailer = require('../mailer/mailer');
var User = require('../models/user.js');
var Resident = require('../models/resident.js');
var async = require('async');

module.exports = {

    /**
     * Creates a new user.
     * @param {string} name - The user's name.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @param {string} passwordconf - The user's password confirmation, verification purposes.
     */
    createUser: function (req, res, next) {
        if (req.body.first === undefined) {
            return res.status(404).json({message: 'FirstName not found'});
        }
        if (req.body.last === undefined) {
            return res.status(404).json({message: 'Lastname not found'});
        }
        if (req.body.email === undefined) {
            return res.status(404).json({message: 'Email not found'});
        }
        if (req.body.doc === undefined) {
            return res.status(404).json({message: 'Document not found'});
        }
        if (req.body.location === undefined) {
            return res.status(404).json({message: 'Location not found'});
        }

        if (req.body.role === 'resident') {

            if (req.body.numcontract === undefined) {
                return res.status(404).json({message: 'Contract Number not found'});
            }if (req.body.apartment === undefined) {
                return res.status(404).json({message: 'Apartment not found'});
            }if (req.body.rate === undefined) {
                return res.status(404).json({message: 'Rate not found'});
            }if (req.body.currency === undefined) {
                return res.status(404).json({message: 'Currency not found'});
            }if (req.body.rateusd === undefined) {
                return res.status(404).json({message: 'Rate USD not found'});
            }if (req.body.agent === undefined) {
                return res.status(404).json({message: 'Agent not found'});
            }if (req.body.finish === undefined) {
                return res.status(404).json({message: 'Finish not found'});
            }if (req.body.start === undefined) {
                return res.status(404).json({message: 'Start not found'});
            }if (req.body.duration === undefined) {
                return res.status(404).json({message: 'Duration not found'});
            }

        }

        var pswd = req.body.document;
        var pswd_conf = req.body.document;

        if (pswd == pswd_conf) {

            var user = new User({
                name: {
                    first: req.body.first,
                    last: req.body.last
                },
                phone: {
                    number: req.body.phone
                },
                email: req.body.email,
                password: req.body.document,
                location: req.body.location,
                document: {
                    doctype: req.body.doctype,
                    number: req.body.document
                },
                role: req.body.role

            });

            user.save(function (err,u) {
                if (!err) {
                    if(u.role === 'resident'){
                        var resident = new Resident({
                            user_id: u._id,
                            contract_number: req.body.numcontract,
                            birth_date: req.body.birth_date,
                            apartment: req.body.apartment,
                            bed: req.body.bed,
                            bedtype: req.body.bedtype,
                            rate: req.body.rate,
                            currency: req.body.currency,
                            rateusd: req.body.rateusd,
                            agent: req.body.agent,
                            finish: req.body.finish,
                            start: req.body.start,
                            duration: req.body.duration
                        });

                        resident.save(function(err){
                           if(!err){
                               console.log('New resident has benn created')
                           }
                        });
                    }
                    req.user = user;
                    mailer.welcome(user);
                    res.status(200).json({error: false, users: user, message: "User has been created"});
                } else {
                    console.log('ERROR: ' + err);
                    res.status(201).json({message: "User already exists"});
                }
            });
        } else {
            res.status(400).json({message: 'password and password confirmation mismatch'});
        }
    },

    /**
     * Reads all users.
     * @param {string} page - The user's name.
     * @param {string} search - The user's email.
     */
    readUsers: function (req, res, next) {

        var search = '';
        console.log(req.query.page);
        var page = req.query.page || 1;
        console.log(page);
        if (req.query.search) {
            search = req.query.search;
        }

        async.parallel([

            function (callback) {

                User.find({roles: {$nin: ["admin"]}, active: true}).or([
                    {
                        'name.first': new RegExp(search, 'i')
                    },
                    {
                        'name.last': new RegExp(search, 'i')
                    },
                    {
                        email: new RegExp(search, 'i')
                    },
                    {
                        doc: new RegExp(search, 'i')
                    }
                ])
                    .sort({created: -1}).limit(10).skip((page - 1) * 10).exec(function (err, users) {
                    if (err) {
                        console.log('ERROR: ' + err);
                        callback(err, null);
                    } else {
                        callback(null, users);
                    }
                });

            }, function (callback) {

                User.count({
                    $or: [{
                        'name.first': new RegExp(search, 'i')
                    },
                        {
                            'name.last': new RegExp(search, 'i')
                        },
                        {
                            email: new RegExp(search, 'i')
                        },
                        {
                            doc: new RegExp(search, 'i')
                        }]
                }).exec(function (err, count) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, count);
                    }
                });

            }

        ], function (err, results) {
            if (err) {
                return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
            } else {
                return res.status(200).json({error: false, users: results[0], count: results[1], page: parseInt(page)});
            }
        });

    },

    /**
     * Updates user.
     * @param {string} id - The user's id.
     */
    updateUser: function (req, res, next) {
        User.findById(req.params.id, function (err, user) {
            if (err) {
                res.status(500).json({message: 'Internal Server Error'});
            }
            if (!user) {
                res.status(404).json({message: 'User not found'});
            } else {
                user.name = req.body.name || user.name;
                user.company = req.body.company || user.company;
                user.phone = req.body.phone || user.phone;
                user.address1 = req.body.address1 || user.address1;
                user.address2 = req.body.address2 || user.address2;
                user.email = req.body.email || user.email;
                if (user.email != req.body.email) {
                    verified_email = false;
                }
                user.updated = Date.now();

                if (user.email != req.body.email) {
                    user.email = req.body.email || user.email;
                }

                user.save(function (err, u) {
                    if (err) {
                        res.status(500).json({message: 'Internal Server Error'});
                    } else {
                        res.status(200).json({
                            user: {
                                name: u.name,
                                company: u.company,
                                phone: u.phone,
                                address1: u.address1,
                                address2: u.address2,
                                email: u.email,
                                verified_email: u.verified_email
                            }
                        });
                    }
                });

            }
        });
    },

    /**
     * Deletes user.
     * @param {string} id - The user's id.
     */
    deleteUsers: function (req, res, next) {

        User.remove({_id: {$in: req.body.users}}, function (err) {
            if (err) {
                console.log('ERROR: ' + err);
                return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
            } else {
                return res.status(200).json({error: false, message: 'User has been removed'});
            }
        });
    },

    /**
     * Send password reset message.
     * @param {string} email - users email.
     */
    resetPassword: function (req, res, next) {
        User.findOne({email: req.body.email}, function (err, user) {
            if (err) return next(err);
            if (!user) {
                res.status(404).json({message: 'User not found'});
            } else {
                user.reset_password_token = crypto.randomBytes(48).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
                user.reset_password_sent_at = Date.now();
                user.save(function (err) {
                    if (!err) {
                        mailer.resetPassword(user);
                        res.status(200).json({message: 'Instructions has been sent to your email'});
                    } else {
                        res.status(500).json({message: 'Internal Server Error'});
                    }
                });
            }
        });
    },

    /**
     * Update password.
     * @param {string} password - new password.
     * @param {string} passwordconfirmation - new password confirmation.
     */
    updatePassword: function (req, res, next) {

        if (req.body.password === undefined) {
            res.status(404).json({message: 'password not found'});
        }

        if (req.body.passwordconfirmation === undefined) {
            res.status(404).json({message: 'password confirmation not found'});
        }

        if (req.body.password == req.body.passwordconfirmation) {

            User.findById(req.body.id, function (err, user) {
                if (err) {
                    res.status(404).json({message: "User not found"});
                }
                if (!user) {
                    res.status(404).json({message: "User not found"});
                } else {
                    if (user.hash && user.salt) {
                        if (user.reset_password_token == req.body.reset_password_token) {
                            res.status(422).json({message: "Lo sentimos este link ya caduco. Intenta hacer una solicitud de nuevo"});
                        } else {
                            user.password = req.body.password;
                            user.save();
                            res.status(200).json({message: "Tu contraseña ha sido modificada exitosamente"});
                        }
                    } else {
                        user.password = req.body.password;
                        user.save();
                        res.status(200).json({message: "Password updated"});
                    }
                }
            });

        } else {
            res.status(400).json({message: 'password and password confirmation mismatch'});
        }
    }

};