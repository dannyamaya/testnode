var mailer = require('../mailer/mailer');
var User = require('../models/user.js');
var Resident = require('../models/resident.js');
var async = require('async');
var moment = require('moment');
var crypto = require('crypto');


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
        if (req.body.document === undefined) {
            return res.status(404).json({message: 'Document not found'});
        }
        if (req.body.location === undefined) {
            return res.status(404).json({message: 'Location not found'});
        }

        if (req.body.role === 'resident') {

            if (req.body.numcontract === '') {
                return res.status(404).json({message: 'Contract Number not found'});
            }
            if (req.body.apartment === '') {
                return res.status(404).json({message: 'Apartment not found'});
            }
            if (req.body.apartmentType === '') {
                return res.status(404).json({message: 'Apartment type not found'});
            }
            if (req.body.rate === '') {
                return res.status(404).json({message: 'Rate not found'});
            }
            if (req.body.currency === '') {
                return res.status(404).json({message: 'Currency not found'});
            }
            if (req.body.rateusd === '') {
                return res.status(404).json({message: 'Rate USD not found'});
            }
            if (req.body.agent === '') {
                return res.status(404).json({message: 'Agent not found'});
            }
            if (req.body.finish === '') {
                return res.status(404).json({message: 'Finish not found'});
            }
            if (req.body.start === '') {
                return res.status(404).json({message: 'Start not found'});
            }
            if (req.body.duration === '') {
                return res.status(404).json({message: 'Duration not found'});
            }
        }

        if (req.body.role !== 'resident') {
            if (req.body.occupation === '') {
                return res.status(404).json({message: 'Ocuppation not found'});
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
                doc: {
                    typedoc: req.body.doctype,
                    number: req.body.document
                },
                role: req.body.role,
                occupation: req.body.occupation,
                time_zone: req.body.timezone,
                skype: req.body.skype

            });

            user.save(function (err, u) {
                if (!err) {
                    if (u.role === 'resident') {
                        var resident = new Resident({
                            user_id: u._id,
                            contract_number: req.body.numcontract,
                            birth_date: req.body.birth_date,
                            apartment: req.body.apartment,
                            apartment_type: req.body.apartmentType,
                            bathroom: req.body.bathroom,
                            status: req.body.status,
                            bed: req.body.bed,
                            rate: req.body.rate,
                            currency: req.body.currency,
                            rateusd: req.body.rateusd,
                            agent: req.body.agent,
                            finish: req.body.finish,
                            start: req.body.start,
                            duration: req.body.duration
                        });

                        resident.save(function (err) {
                            if (!err) {
                                console.log('New resident has been created')
                            }
                            else {
                                console.log(err);
                                return res.status(409).json({message: "Error, check your details."});

                            }
                        });
                    }
                    req.user = user;
                    mailer.welcome(user);
                    return res.status(200).json({error: false, users: user, message: "User has been created"});
                } else {
                    console.log('ERROR: ' + err);
                    return res.status(409).json({message: 'E-mail already exist'});
                }
            });
        } else {
            return res.status(400).json({message: 'password and password confirmation mismatch'});
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

    readUser: function (req, res, next) {

        User.findById(req.params.id, function (err, user) {
            if (err) return next(err);
            if (!user) {
                return res.status(404).json({message: 'User not found'});
            } else {
                return res.status(200).json({message: 'User Founded', user: user});
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
                return res.status(500).json({message: 'Internal Server Error'});
            }
            if (!user) {
                return res.status(404).json({message: 'User not found'});
            } else {
                user.email = req.body.email || user.email;
                user.name.first = req.body.first || user.name.first;
                user.name.last = req.body.last || user.name.last;
                user.doc.number = req.body.document || user.doc.number;
                user.doc.typedoc = req.body.doctype || user.doc.typedoc;
                user.phone.number = req.body.phone || user.phone.number;
                user.role = req.body.role || user.role;
                user.occupation = req.body.occupation || user.occupation;
                user.location = req.body.location || user.location;
                user.skype = req.body.skype || user.skype;
                user.time_zone = req.body.timezone || user.time_zone;

                if (user.email != req.body.email) {
                    user.email_verified = false;
                }
                user.updated = Date.now();


                if (req.body.role === 'resident') {
                    Resident.findOne({user_id: user._id}, function (err, resident) {
                        if (err) {
                            return res.status(500).json({message: 'Internal Server Error'});
                        }
                        if (!user) {
                            return res.status(404).json({message: 'Resident not found'});
                        }

                        if (req.body.numcontract === '') {
                            return res.status(404).json({message: 'Contract Number not found'});
                        }
                        if (req.body.apartment === '') {
                            return res.status(404).json({message: 'Apartment not found'});
                        }
                        if (req.body.apartmentType === '') {
                            return res.status(404).json({message: 'Apartment type not found'});
                        }
                        if (req.body.rate === '') {
                            return res.status(404).json({message: 'Rate not found'});
                        }
                        if (req.body.currency === '') {
                            return res.status(404).json({message: 'Currency not found'});
                        }
                        if (req.body.rateusd === '') {
                            return res.status(404).json({message: 'Rate USD not found'});
                        }
                        if (req.body.agent === '') {
                            return res.status(404).json({message: 'Agent not found'});
                        }
                        if (req.body.finish === '') {
                            return res.status(404).json({message: 'Finish not found'});
                        }
                        if (req.body.start === '') {
                            return res.status(404).json({message: 'Start not found'});
                        }
                        if (req.body.duration === '') {
                            return res.status(404).json({message: 'Duration not found'});
                        }

                        resident.contract_number = req.body.numcontract || resident.contract_number;
                        resident.birth_date = moment(req.body.birthdate).format() || resident.birth_date;
                        resident.apartment = req.body.apartment || resident.apartment;
                        resident.apartment_type = req.body.apartmentType || resident.apartment_type;
                        resident.bathroom = req.body.bathroom || resident.bathroom;
                        resident.status = req.body.status || resident.status;
                        resident.bed = req.body.bed || resident.bed;
                        resident.rate = req.body.rate || resident.rate;
                        resident.currency = req.body.currency || resident.currency;
                        resident.rateusd = req.body.rateusd || resident.rateusd;
                        resident.agent = req.body.agent || resident.agent;
                        resident.finish = moment(req.body.finish).format() || resident.finish;
                        resident.start = moment(req.body.start).format() || resident.start;
                        resident.duration = req.body.duration || resident.duration;
                        resident.updated = Date.now();


                        resident.save(function (err) {
                            if (!err) {
                                console.log('Resident Updated')
                            }
                            else {
                                console.log(err);
                                return res.status(409).json({message: "Error, check your details."});

                            }
                        });

                    });
                }

                user.save(function (err, u) {
                    if (err) {
                       return res.status(500).json({message: 'Internal Server Error'});
                    } else {
                       return res.status(200).json({
                            user: user
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
                      console.log(err);
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
