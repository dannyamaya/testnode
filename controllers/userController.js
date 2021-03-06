var mailer = require('../mailer/mailer');
var User = require('../models/user.js');
var Resident = require('../models/resident.js');
var async = require('async');
var moment = require('moment');
var crypto = require('crypto');
var csv = require('express-csv');
var s3deploy = require('../helpers/bucketDeployHelper');
var AWS_PREFIX = 'https://s3-sa-east-1.amazonaws.com/cannedhead.livinn/';
var fs = require('fs');


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

        /*Verify if user already exist but was deleted*/
        User.findOne({email: req.body.email, active: false}, function (err, user) {
            if (err) {
                console.log('Error checking if user exist with active false');
            }
            if (user) {
                user.active = true;
                user.save(function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                mailer.welcome(user);
                return res.status(200).json({
                    error: false,
                    users: user,
                    message: "The account of this user has been re-established"
                });
            }
            else {
                var file = req.files.image;

                if (file) {

                    var fileName = req.files.image.name;
                    var filePath = './uploads/' + fileName;
                    file.mv(filePath, function (err) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        }
                    });

                    var upload = true;
                    var folder = 'profile_pictures/';
                    fileName = fileName.replace(/[^a-zA-Z0-9.]/g, "");
                    upload = s3deploy.uploadFiles(filePath, fileName, req.body.document, file.data, folder);

                    if (!upload)
                        return res.status(404).json({message: 'Error uploading file!'});

                    // url stored in db
                    var imagenUrl = AWS_PREFIX + folder + req.body.document + '/' + fileName;
                    //local file deleted
                    fs.unlinkSync(filePath);
                }
                else {
                    var imagenUrl = AWS_PREFIX + 'foto.png';
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
                        profile_picture: imagenUrl,
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
                                    start: req.body.start
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
                            return res.status(409).json({message: 'Error, check your details'});
                        }
                    });
                } else {
                    return res.status(400).json({message: 'password and password confirmation mismatch'});
                }

            }
        });


    },

    /**
     * Reads all users.
     * @param {string} page - The user's name.
     * @param {string} search - The user's email.
     */
    readUsers: function (req, res, next) {

        var search = '';
        var page = req.query.page || 1;
        if (req.query.search) {
            search = req.query.search;
        }

        var query = {};
        query['role'] = {$nin: ["admin"]};
        query['active'] = true;

        if (req.user.role != 'admin') {
            query['location'] = req.user.location;
        }

        if (req.user.role == 'admin' && req.query.location) {
            query['location'] = req.query.location;
        }

        if (req.query.role && req.query.role != 'admin') {
            query['role'] = new RegExp(req.query.role, 'i');
        }

        async.parallel([

            function (callback) {

                User.find(query).or([
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
                        'doc.number': new RegExp(search, 'i')
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

                User.count(query).or([
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
                        location: new RegExp(search, 'i')
                    },
                    {
                        role: new RegExp(search, 'i')
                    },
                    {
                        'doc.number': new RegExp(search, 'i')
                    }
                ])
                    .exec(function (err, count) {
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
     * Read user.
     * @param {string} page - The user's name.
     * @param {string} search - The user's email.
     */
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
        console.log(req.body);
        var errorResident = false;
        User.findById(req.params.id, function (err, user) {
            if (err) {
                return res.status(500).json({message: 'Internal Server Error'});
            }
            if (!user) {
                return res.status(404).json({message: 'User not found'});
            } else {

                var file = req.files.image;

                if (file) {
                    var fileName = req.files.image.name;
                    var filePath = './uploads/' + fileName;
                    file.mv(filePath, function (err) {
                        if (err)
                            return res.status(500).send(err);
                    });

                    var upload = true;
                    var folder = 'profile_pictures/';
                    fileName = fileName.replace(/[^a-zA-Z0-9.]/g, "");
                    upload = s3deploy.uploadFiles(filePath, fileName, req.body.document, file.data, folder);

                    if (!upload)
                        return res.status(404).json({message: 'Error uploading file!'});

                    // url stored in db
                    ;
                    var imagenUrl = AWS_PREFIX + folder + req.body.document + '/' + fileName;
                    //local file deleted
                    console.log(imagenUrl);


                    fs.unlinkSync(filePath);
                }

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
                user.profile_picture = imagenUrl || user.profile_picture;

                if (user.email != req.body.email) {
                    user.email_verified = false;
                }
                user.updated = Date.now();


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

                    Resident.findOne({user_id: user._id}, function (err, resident) {
                        if (err) {
                            return res.status(500).json({message: 'Internal Server Error'});
                        }


                        if (!resident) {

                            var residentnew = new Resident({
                                user_id: req.params.id,
                                contract_number: req.body.numcontract,
                                birth_date: req.body.birthdate,
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
                                start: req.body.start
                            });

                            residentnew.save(function (err) {
                                if (!err) {
                                    console.log('New resident has been created');
                                }
                                else {
                                    errorResident = true;

                                }
                            });

                        }
                        else {
                            resident.contract_number = req.body.numcontract || resident.contract_number;

                            if (req.body.birthdate == '') {
                                resident.birth_date = resident.birth_date;
                            } else {
                                console.log('allaaaa')

                                resident.birth_date = moment(req.body.birthdate).format();
                            }

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
                                    errorResident = err;
                                }
                            });
                        }

                    });
                }

                user.save(function (err, u) {
                    if (err || errorResident) {
                        console.log(errorResident);

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

        User.find({_id: {$in: req.body['users[]']}}, function (err, users) {
            if (err) {
                console.log('ERROR: ' + err);
                return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
            } else {
                users.forEach(function (user) {
                    user.active = false;
                    user.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
                return res.status(200).json({error: false, message: 'User has been removed'});
            }
        });
    },
    /*
    User.remove({_id: {$in: req.body['users[]']}}, function (err) {
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
                user.reset_password_token = crypto.randomBytes(48).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
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
    }
    ,

    /**
     * Render password recovery view.
     * @param {string} i - user's id.
     * @param {string} t - user's reset password token.
     */
    showResetPassword: function (req, res, next) {
        User.findById(req.query.i, function (err, user) {
            if (err) return next(err);
            if (!user) {
                res.render('404');
            } else {
                if (user.reset_password_token == req.query.t) {
                    user.reset_password_token = crypto.randomBytes(127).toString('hex').toString();
                    user.reset_password_sent_at = Date.now();
                    user.save();
                    res.render('reset-password', {
                        title: 'Reset your password',
                        logged: req.isAuthenticated(),
                        user: user
                    });
                }
                else {
                    res.render('token-expired', {
                        title: 'token expired'
                    });
                }
            }
        });
    }
    ,

    /**
     * Update password.
     * @param {string} password - new password.
     * @param {string} passwordconfirmation - new password confirmation.
     */
    updatePassword: function (req, res, next) {

        console.log(req.body);

        if (req.body.password === undefined) {
            return res.status(404).json({message: 'password not found'});
        }

        if (req.body.passwordconfirmation === undefined) {
            return res.status(404).json({message: 'password confirmation not found'});
        }

        if (req.body.password == req.body.passwordconfirmation) {

            User.findById(req.body.id, function (err, user) {
                if (err) {
                    return res.status(404).json({message: "User not found"});
                }
                if (!user) {
                    return res.status(404).json({message: "User not found"});
                } else {
                    if (user.hash && user.salt) {
                        if (!req.body.oldpassword && user.reset_password_token == req.body.reset_password_token) {
                            console.log("old reset password link");
                            return res.status(422).json({message: "Lo sentimos este link ya caduco. Intenta hacer una solicitud de nuevo"});
                        } else if (req.body.oldpassword && !req.body.reset_password_token) {
                            user.verifyPassword(req.body.oldpassword, function (err, passwordCorrect) {
                                if (err) {
                                    console.log("check old password case");
                                    return res.status(422).json({message: "Check your old password"});
                                } else {
                                    user.password = req.body.password;
                                    user.save();
                                    return res.status(200).json({message: "Tu contraseña ha sido modificada exitosamente"});
                                }
                            });
                        } else {
                            user.password = req.body.password;
                            user.save();
                            return res.status(200).json({message: "Tu contraseña ha sido modificada exitosamente"});
                        }
                    } else {
                        console.log("password has never been set");
                        user.password = req.body.password;
                        user.save();
                        return res.status(200).json({message: "Password updated"});
                    }
                }
            });

        } else {
            return res.status(400).json({message: 'password and password confirmation mismatch'});
        }
    }
    ,

    /**
     * Export users to csv file.
     * @param {string} page - The user's name.
     * @param {string} search - The user's email.
     */
    exportUsers: function (req, res, next) {

        var search = '';
        var page = req.query.page || 1;
        if (req.query.search) {
            search = req.query.search;
        }

        var query = {};
        query['role'] = {$nin: ["admin"]};
        query['active'] = true;

        if (req.user.role != 'admin') {
            query['location'] = req.user.location;
        }

        if (req.user.role == 'admin' && req.query.location) {
            query['location'] = req.query.location;
        }

        if (req.query.role && req.query.role != 'admin') {
            query['role'] = new RegExp(req.query.role, 'i');
        }


        User.find(query)
            .or([
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
                    location: new RegExp(search, 'i')
                },
                {
                    role: new RegExp(search, 'i')
                },
                {
                    doc: new RegExp(search, 'i')
                }
            ])
            .sort({created: -1}).exec(function (err, users) {
            if (err) {
                console.log('ERROR: ' + err);
                res.status(500).json({err: err, message: "Internal Server Error"});
            } else {

                var usuarios = [];

                usuarios.push({
                    email: "Email",
                    firstname: "First name",
                    lastname: "Last name",
                    doctype: "Document type",
                    doc: "Document",
                    cellphone: "Cellphone",
                    occupation: "Occupation",
                    skype: "Skype",
                    location: "Location",
                    role: "Role",
                    created: "Created",
                    updated: "Updated",
                    lastlogin: "Last login"
                });

                users.forEach(function (user) {
                    usuarios.push({
                        email: user.email,
                        firstname: user.name.first,
                        lastname: user.name.last,
                        doctype: user.doc.typedoc,
                        doc: user.doc.number,
                        cellphone: user.phone.number,
                        occupation: user.occupation,
                        skype: user.skype,
                        location: user.location,
                        role: user.role,
                        created: moment(user.created).format('YYYY-DD-MM'),
                        updated: moment(user.updated).format('YYYY-DD-MM'),
                        lastlogin: moment(user.lastlogin).format('YYYY-DD-MM')
                    });
                });

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-disposition', 'attachment; filename=Usuarios.csv');
                res.csv(usuarios);

            }
        });
    }
    ,

    /**
     * Welcome user.
     * @param {string} i - The user's id.
     * @param {string} t - The user's email token.
     */
    welcome: function (req, res, next) {

        if (req.query.i === undefined && req.query.t === undefined && req.query.i != '' && req.query.t != '') {
            res.render('404');
        } else {

            User.findById(req.query.i, function (err, user) {
                if (err) {
                    res.render('500');
                }
                if (!user) {
                    res.render('404');
                } else {
                    if (user.email_token == req.query.t) {
                        user.verified_email = true;
                        user.email_token = crypto.randomBytes(127).toString('hex').toString(); //resets token
                        user.save();
                        res.render('welcome', {
                            title: 'Welcome',
                            user: user
                        });
                    }
                    else {
                        res.render('token-expired-new-user');
                    }
                }
            });

        }
    }
    ,

    /**
     * Updates user last login.
     * @param {string} id - The user's id.
     */
    updateLastLogin: function (id) {
        User.findById(id, function (err, user) {
            if (err) {
                console.log('ERROR: ' + err);
            }
            if (!user) {
                console.log('User not found!');
            } else {
                user.lastlogin = moment() || user.lastlogin;
                user.save(function (err) {
                    if (!err) {

                    } else {
                        console.log('ERROR: ' + err);
                    }
                });
            }
        });
    }
    ,

    autocompleteUsers: function (req, res, next) {

        User.find({}, function (err, user) {
            return res.status(200).json({user: user});

            return res.status(200).json({user: user});
        });

    },

    readUsersExceptResidents: function (req, res, next) {

        var search = '';
        var page = req.query.page || 1;
        if (req.query.search) {
            search = req.query.search;
        }

        var query = {};
        query['role'] = {$nin: ["resident"]};
        query['active'] = true;

        if (req.user.role != 'admin') {
            query['location'] = req.user.location;
        }

        if (req.user.role == 'admin' && req.query.location) {
            query['location'] = req.query.location;
        }

        if (req.query.role && req.query.role != 'admin') {
            query['role'] = new RegExp(req.query.role, 'i');
        }

        async.parallel([

            function (callback) {

                User.find(query).or([
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
            }

        ], function (err, results) {
            if (err) {
                return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
            } else {
                return res.status(200).json({error: false, users: results[0], page: parseInt(page)});
            }
        });

    },


};


