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
     * @param {Object} user - User in session.
     * @param {string} category - Work order category.
     * @param {string} subject - Work order subject.
     * @param {string} message - Ticket message.
     * @param {string} attachments - Work order attachments.
     */
    createTicket: function (req, res, next) {


        if (!req.user || req.user === undefined) {
            return res.status(404).json({message: 'User not found'});
        }

        if (!req.body.category || req.body.category === undefined) {
            return res.status(404).json({message: 'category not found'});
        }

        if (!req.body.subject || req.body.subject === undefined) {
            return res.status(404).json({message: 'subject not found'});
        }

        if (!req.body.message || req.body.message === undefined) {
            return res.status(404).json({message: 'message not found'});
        }

        var file = req.files.attachments;

        if (file) {

            var fileName = req.files.attachments.name;

            var filePath = './uploads/' + fileName;

            file.mv(filePath, function (err) {
                if (err)
                    return res.status(500).json({message: 'Error uploading file!'});

            });
            var folder = 'attachments/';
            var upload = true;
            upload = s3deploy.uploadFiles(filePath, fileName, req.user._id, file.data, folder);

            if (!upload)
                return res.status(404).json({message: 'Error uploading file!'});

            // url stored in db
            var imagenUrl = AWS_PREFIX + folder + req.user._id + '/' + fileName;

            //local file deleted
            fs.unlinkSync(filePath);
        }

        var ticket = new Ticket({
            requested_by: req.body.requested_by || req.user._id ,
            created_by: req.user._id,
            subject: req.body.subject,
            message: req.body.message,
            attachments: imagenUrl || '',
            category: req.body.category,
            file_name: fileName,
            location: req.body.location
        });

        ticket.save(function (err, t) {
            if (!err) {
                Ticket.populate(t,"requested_by created_by" , function(err, tpopulated) {
                    if (err){
                        console.log('ERROR: ' + err);
                        res.status(500).json({ err: err, message: "Internal Server Error"});
                    }
                    if(!tpopulated){
                        res.status(404).json({ message: "User not found" });
                    }else {
                        mailer.newTicket(tpopulated);
                        return res.status(200).json({ticket: tpopulated, message: "Work Order has been created"});
                    }
                });

            } else {
                console.log('ERROR: ' + err);
                return res.status(500).json({err: err});
            }
        });
    },

    readTickets: function (req, res, next) {

        var search = req.query.search || '',
            page = req.query.page || 1,
            category = req.query.category || '',
            subcategory = req.query.subcategory || '';
            status = req.query.status || '';
            priority = req.query.priority || '';
            location = req.user.location;

        var options = [{
                        location:location
                    },
                    {
                        subject: new RegExp(search, 'i')
                    },
                    {
                        category: new RegExp(category, 'i')
                    },
                    {
                        subcategory: new RegExp(subcategory, 'i')
                    },
                    {
                        message: new RegExp(search, 'i')
                    },
                    {
                        filedby: new RegExp(search, 'i')
                    },
                    {
                        status: new RegExp(status, 'i')
                    },
                    {
                        priority: new RegExp(priority, 'i')
                    }];

        async.parallel([

            function (callback) {

                Ticket.find({}).or(options)
                .populate('requested_by','name company email phone profile_picture')
                .populate('created_by','name company email phone profile_picture')
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
                    $or: options
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
            .populate('created_by', 'name company email phone profile_picture')
            .populate('requested_by', 'name company email phone profile_picture')
            .populate('assigned_to','name company email phone profile_picture')
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

        if(!req.params.id)
            return res.status(404).json({message: 'No ticket found'});

        Ticket.findById(req.params.id, function (err, ticket) {
            if (err) {
                console.log('ERROR: ' + err);
                return res.status(500).json({err: err});
            }
            if (!ticket) {
                return res.status(404).json({message: 'message not found'});
            } else {
                ticket.subject = req.body.subject || ticket.subject;
                ticket.message = req.body.message || ticket.message;
                ticket.priority = req.body.priority || ticket.priority;
                ticket.category = req.body.category || ticket.category;
                ticket.subcategory = req.body.subcategory || ticket.subcategory;

                if(req.body.opened == "true"){
                    ticket.opened = true;
                } else if(req.body.opened == "false") {
                    ticket.opened = false;
                } else {

                }

                if(req.body.opened_resident == "true"){
                    ticket.opened_resident = true;
                } else if(req.body.opened_resident == "false") {
                    ticket.opened_resident = false;
                } else {

                }

                ticket.assigned_to = req.body.assigned_to || ticket.assigned_to;

                if(!ticket.assigned_to.includes(req.body.assignee))
                    ticket.assigned_to.push(req.body.assignee);

                if(req.body.remove){
                    ticket.assigned_to.pull({_id:req.body.assignee});
                }

                ticket.reply_of = req.body.reply_of || ticket.reply_of;
                ticket.status = req.body.status || ticket.status;
                ticket.updated = Date.now();

                ticket.save(function (err) {
                    if (!err) {
                        return res.status(200).json({message: "Ticket has been updated",ticket:ticket});
                    } else {
                        console.log('ERROR: ' + err);
                        return res.status(500).json({err: err});
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
        var id = req.query.id,
            created_by = req.query.created_by,
            filed_by = req.query.filed_by,
            page = req.query.page || 1,
            category = req.query.category,
            subcategory = req.query.subcategory,
            status = req.query.status,
            priority = req.query.priority,
            location = req.user.location;


        var options  = {};

        if(req.user.role == 'admin'){
            if(req.query.location){
                options['location'] = req.query.location
            }
        } else {
            options['location'] = req.user.location;
        }


        if(id){
            var o_id = new ObjectId(id);
            options['_id'] = o_id;
        }

        if(category){
            options['category'] = category;
        }

        if(subcategory){
            options['subcategory'] = subcategory;
        }

        if(status){
            options['status'] = status;
        }

        if(priority){
            options['priority'] = priority;
        }


        console.log(options);


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
                        Ticket.find(options)
                        .populate('created_by', 'name company email phone profile_picture')
                        .populate('requested_by', 'name company email phone profile_picture')
                        .populate('assigned_to', 'name company email phone profile_picture')
                        .sort({created: -1}).limit(10).skip((page - 1) * 10).exec(function (err, t) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if(req.query.created_by){
                                    var regexp = new RegExp(req.query.created_by, 'i');
                                    var tickets = t.filter( function(val){
                                        return regexp.test(val.created_by.name.first);
                                    });
                                    callback(null, tickets);
                                }
                                else if(req.query.assigned_to){
                                    var regexp = new RegExp(req.query.assigned_to, 'i');

                                    function checkRegexp(u){
                                        return regexp.test(u.name.first,'i');
                                    };
                                    var tickets = t.filter( function(val){
                                        return val.assigned_to.some(checkRegexp);
                                    });
                                    callback(null, tickets);
                                }else{
                                    tickets = t;
                                    callback(null, tickets);
                                }
                            }
                        });

                    },
                    function (callback) {

                        Ticket.count(options).exec(function (err, count) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, count);
                            }
                        });
                    }
                ], function (err, results) {
                    if (err) {
                        console.log('ERROR: ' + err);
                        return res.status(500).json({
                            error: true,
                            message: 'Server connection error. Please try later'
                        });
                    } else {

                        // filter: requested_by
                        if(req.user.role == 'admin'){
                            if(req.query.requested_by){
                                var regexp = new RegExp(req.query.requested_by, 'i');
                                var tickets = results[0].filter( function(val){
                                    return regexp.test(val.requested_by.name.first);
                                });
                            }else{
                                var tickets = results[0];
                            }
                        }
                        else{
                            var tickets = results[0].filter( function(val){
                                return (val.requested_by.id == req.user.id);
                            });
                        }

                        // console.log('RESULTS************');
                        // tickets.forEach(function(r) {
                        //     console.log('SUBJECT:' + r.subject, '- CATEGORY: ' + r.category, '- LOCATION: ' + r.location, '- REQUESTED_BY: ' + r.requested_by.name.first, '- CREATED BY: ' + r.created_by.name.first, r.assigned_to);
                        //     console.log('***************');
                        // });

                        //console.log(results[0]);

                       return res.status(200).json({
                            error: false,
                            tickets: tickets,
                            count: results[1],
                            page: parseInt(page)
                        });
                    }
                });
            }
        });
    }

}
