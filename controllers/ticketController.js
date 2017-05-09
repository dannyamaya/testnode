var Ticket = require('../models/ticket.js'),
    User = require('../models/user.js');
var mailer = require('../mailer/mailer'),
    async = require("async");
var ObjectId = require('mongoose').Types.ObjectId;
var strftime = require('strftime');
var slug = require('slug');
var s3deploy = require('../helpers/bucketDeployHelper');
var fs = require('fs');

var AWS_PREFIX = 'https://s3-sa-east-1.amazonaws.com/cannedhead.livinn/';

module.exports = {

    /**
     * Creates a new ticket.
     * @param {Object} user - User.
     * @param {string} subject - Ticket subject.
     * @param {string} password - Ticket message.
     */


    createTicket: function (req, res, next) {


        if (req.user === undefined) {
            return res.status(404).json({message: 'User not found'});
        }

        if (req.body.subject === undefined) {
            return res.status(404).json({message: 'subject not found'});
        }

        if (req.body.message === undefined) {
            return res.status(404).json({message: 'message not found'});
        }


        var file = req.files.attachments;

        if (file) {

            var fileName = req.files.attachments.name;

            var filePath = './uploads/' + fileName;

            file.mv(filePath, function (err) {
                if (err)
                    return res.status(500).send(err);
            });
            var folder = 'attachments/';
            var upload = true;
            upload = s3deploy.uploadFiles(filePath, fileName, req.user._id, file.data, folder);

            if (!upload)
                return res.status(404).json({message: 'Error uploading file!'});

            //console.log(req.files);
            // url stored in db

            var imagenUrl = AWS_PREFIX + folder + req.user._id + '/' + fileName;

            //local file deleted
            fs.unlinkSync(filePath);
        }

        var ticket = new Ticket({
            client_id: req.user._id,
            subject: req.body.subject,
            message: req.body.message,
            attachments: imagenUrl || '',
            category: req.body.category,
            filedby: req.body.filedby,
            file_name: fileName
        });

        ticket.save(function (err, t) {
            if (!err) {
                Ticket.populate(t,{ path:"filedby" }, function(err, tpopulated) {
                            if (err){
                                console.log('ERROR: ' + err);
                                res.status(500).json({ err: err, message: "Internal Server Error"});
                            }
                            if(!tpopulated){
                                res.status(404).json({ message: "Client not found" });
                            }else {
                                return res.status(200).json({ticket: tpopulated, message: "Ticket has been created"});
                            }
                      });

            } else {
                console.log('ERROR: ' + err);
                return res.status(500).json({err: err});
            }
        });


    },

    readTickets: function (req, res, next) {

        var search = '';
        var page = req.query.page || 1;
        if (req.query.search) {
            search = req.query.search;
        }

        async.parallel([

            function (callback) {

                Ticket.find({}).or([
                    {
                        subject: new RegExp(search, 'i')
                    },
                    {
                        category: new RegExp(search, 'i')
                    },
                    {
                        message: new RegExp(search, 'i')
                    },
                    {
                        filedby: new RegExp(search, 'i')
                    },
                    {
                        status: new RegExp(search, 'i')
                    }
                ])
                .populate('filedby')
                .sort({created: -1}).limit(10).skip((page - 1) * 10).exec(function (err, tickets) {
                    if (err) {
                        console.log('ERROR: ' + err);
                        callback(err, null);
                    } else {
                        callback(null, tickets);
                    }
                });

            }, function (callback) {

                Ticket.count({
                    $or: [{
                        subject: new RegExp(search, 'i')
                    },
                        {
                            category: new RegExp(search, 'i')
                        },
                        {
                            message: new RegExp(search, 'i')
                        },
                        {
                            filedby: new RegExp(search, 'i')
                        }, {
                            status: new RegExp(search, 'i')
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

    readTicket: function (req, res, next) {

        Ticket.findOne({_id: req.params.id})
            .populate('client_id', 'name company email')
            .exec(function (err, ticket) {
                if (err) {
                    console.log('ERROR: ' + err);
                    res.status(500).json({err: err, message: "Internal Server Error"});
                }
                if (!ticket) {
                    res.status(404).json({message: "BoardDoc not found"});
                } else {
                    res.status(200).json({ticket: ticket});
                }
            });
    },

    updateTicket: function (req, res, next) {
        Ticket.findById(req.body.id, function (err, ticket) {
            if (err) {
                console.log('ERROR: ' + err);
                res.status(500).json({err: err});
            }
            if (!ticket) {
                res.status(404).json({message: 'message not found'});
            } else {
                ticket.client_id = req.body.client_id || ticket.client_id;
                ticket.subject = req.body.subject || ticket.subject;
                ticket.message = req.body.message || ticket.message;
                ticket.priority = req.body.priority || ticket.priority;
                ticket.assigned_to = req.body.assigned_to || ticket.assigned_to;
                ticket.reply_of = req.body.reply_of || ticket.reply_of;
                ticket.updated = Date.now();

                ticket.save(function (err) {
                    if (!err) {
                        res.status(200).json({message: "Ticket has been updated"});
                    } else {
                        console.log('ERROR: ' + err);
                        res.status(500).json({err: err});
                    }
                });

            }
        });
    },

    deleteTicket: function (req, res, next) {
        Ticket.findById(req.params.id, function (err, ticket) {
            ticket.remove(function (err) {
                if (!err) {
                    res.status(200).json({message: "Ticket has been removed"});
                } else {
                    console.log('ERROR: ' + err);
                    res.status(500).json({err: err});
                }
            })
        });
    },

    readTicketsByUserId: function (req, res, next) {
        var search = '';
        var page = req.query.page || 1;
        if (req.query.search) {
            search = req.query.search;
        }


        User.findById(req.params.id, function (err, user) {
            if (err) {
                console.log('ERROR: ' + err);
                return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
            }
            if (!user) {
                return res.status(404).json({error: true, message: 'User not found'});
            } else {

                async.parallel([
                    function (callback) {

                        /*{
                            $and: [
                                {client_id: req.params.id}
                            ]
                        }*/

                        Ticket.find()
                        .or([
                            {
                                subject: new RegExp(search, 'i')
                            },
                            {
                                category: new RegExp(search, 'i')
                            },
                            {
                                message: new RegExp(search, 'i')
                            }
                        ])
                        .populate('filedby').sort({updated: -1}).limit(10).skip((page - 1) * 10).exec(function (err, tickets) {
                            if (err) {
                                console.log('ERROR: ' + err);
                                callback(err, null);
                            } else {
                                callback(null, tickets);
                            }
                        });

                    },
                    function (callback) {

                        Ticket.count({client_id: req.params.id}).exec(function (err, count) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, count);
                            }
                        });

                    }

                ], function (err, results) {
                    if (err) {
                        return res.status(500).json({
                            error: true,
                            message: 'Server connection error. Please try later'
                        });
                    } else {
                        return res.status(200).json({
                            error: false,
                            tickets: results[0],
                            count: results[1],
                            page: parseInt(page)
                        });
                    }
                });
            }
        });
    }
}
