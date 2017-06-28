var Ticket = require('../models/ticket.js'),
    User = require('../models/user.js');
var mailer = require('../mailer/mailer'),
    async = require("async");
var ObjectId = require('mongoose').Types.ObjectId;
var strftime = require('strftime');
var slug = require('slug');
var s3deploy = require('../helpers/bucketDeployHelper');
var fs = require('fs'),
    gm = require('gm'),
    moment = require('moment');

    // https://github.com/aheckmann/gm - imagemagic

var AWS_PREFIX = 'https://s3-sa-east-1.amazonaws.com/cannedhead.livinn/';

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isLocation(location){
    var islocation = false;
    if(location == 'VC' || location == 'C18' || location == 'C21' || location == 'C33' || location == 'LC' || location == 'AL' ){
        islocation = true;
    }
    return islocation;
}


function getLocation(location){
    var loc = 'NOTFOUND';
    if(location == "VC"){
      loc = "Barranquilla - Villa Campestre";
    } else if(location == "C18"){
      loc = "Bogotá - Calle 18";
    } else if(location == "C21"){
      loc = "Bogotá - Calle 21";
    } else if(location == "C33"){
      loc = "Bogotá - Calle 33";
    } else if(location == "LC"){
      loc = "Santiago - Lord Cochrane";
    } else if(location == "AL"){
      loc = "Viña Del Mar - Alvarez";
    } else {

    }
    return loc;
}


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

        if (!req.body.location || req.body.location === undefined) {
            return res.status(404).json({message: 'location not found'});
        }

        var file = req.files.attachments;
        let file_name = '';


        if (file) {

            file_name = req.files.attachments.name;
            var filePath = './uploads/' + file_name;

            file.mv(filePath, function (err) {
                if (err)
                    return res.status(500).json({message: 'Error uploading file!'});

            });
            var folder = 'attachments/';
            var upload = true;

            fileName = file_name.replace(/[^a-zA-Z0-9.]/g, "");
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
            file_name: file_name,
            location: req.body.location,
            readed_by: req.user._id
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
                    res.status(404).json({message: "Work Order not found"});
                } else {
                    res.status(200).json({ticket: ticket});
                }
            });
    },

    updateTicket: function (req, res, next) {

        let assigned_helper = true;

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

                if( ticket.status!=2 && (ticket.priority != req.body.priority || ticket.category != req.body.category  || ticket.subcategory != req.body.subcategory ) ){
                    ticket.status = 1;
                }

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

                //Agrega usuario al arreglo de leido por
                if(req.body.readed_by && !(ticket.readed_by.indexOf(req.body.readed_by) > -1)){
                    ticket.readed_by.push(req.body.readed_by);
                }

                ticket.assigned_to = req.body.assigned_to || ticket.assigned_to;

                if(req.body.assignee && !(ticket.assigned_to.indexOf(req.body.assignee) > -1)){
                    ticket.assigned_to.push(req.body.assignee);
                    User.findOne({_id: req.body.assignee})
                        .exec(function (err, user) {
                            if (err) {
                                console.log('Cant send email');
                            }
                            if (!ticket && !user) {
                                console.log('Cant send email');
                            } else {
                                //Envia correo al asignado
                                ticket.status = 1;
                                //mailer.newAssignedTo(user,ticket);
                            }
                        });
                }
                else{
                    assigned_helper = false;
                }

                if(req.body.remove){
                    ticket.assigned_to.pull({_id:req.body.assignee});
                }

                if(ticket.status != 2 && req.body.status==2 ){
                    closed = Date.now;
                }

                ticket.reply_of = req.body.reply_of || ticket.reply_of;
                ticket.status = req.body.status || ticket.status;
                ticket.updated = Date.now();

                ticket.save(function (err) {
                    if (!err) {
                        return res.status(200).json({message: "Ticket has been updated",ticket:ticket,assigned_helper:assigned_helper});
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
                options['location'] = new RegExp( req.query.location, 'i');
            }
        } else {
            options['location'] = new RegExp( req.user.location, 'i');
        }


        if(id){
            var workid = id.split("-");

            if(workid.length != 3){
                return res.status(400).json({message:'Not a valid Work Order ID'});
            }  else {

                //validate date
                var datetofilter = workid[0].split('.');
                var locationid = workid[1];
                var idid = workid[2];

                console.log(datetofilter);
                if(datetofilter.length != 3 || parseInt(datetofilter[0]) < 2017 || parseInt(datetofilter[1]) < 1 || parseInt(datetofilter[1]) > 12 || parseInt(datetofilter[2]) < 1 || parseInt(datetofilter[2]) > 31 || isLocation(datetofilter[1]) || !isNumeric(idid) ){
                    return res.status(400).json({message:'Not a valid Work Order ID'});
                }

                //options['created'] = { "$gte": new Date(datetofilter[0],parseInt(datetofilter[1]),datetofilter[2],0,0,0,0) , "$lt": new Date(datetofilter[0],datetofilter[1],datetofilter[2],0 ,0, 0, 0) } ;
                options['location'] = new RegExp(getLocation(locationid), 'i');
                options['id'] = idid;
            }
        }

        if(category){
            options['category'] = new RegExp(category, 'i');
        }

        if(subcategory){
            options['subcategory'] = new RegExp(subcategory, 'i');
        }

        if(status){
            if(status == 'Open'){
                options['status'] = '0';
            } else if(status == 'Pending' ){
                options['status'] = '1';
            } else if (status == 'Resolved'){
                options['status'] = '2';
            } else {
                //options['status'] = '0';
            }
        }

        if(priority){
            if(priority == '<span class="visible-lg">1 / High Priority / 24H</span><span class="hidden-lg">High</span>' || priority =='1'){
                options['priority'] = '1';
            } else if( priority == '<span class="visible-lg">2 / Medium Priority / 48H</span><span class="hidden-lg">Medium</span>' || priority =='2'){
                options['priority'] = '2';
            } else if( priority == '<span class="visible-lg">3 / Low Priority / 72H</span><span class="hidden-lg">Low</span>' || priority =='3') {
                options['priority'] = '3';
            } else if( priority == '<span class="visible-lg">4 / To plan / To schedule</span><span class="hidden-lg">To Plan</span>' || priority =='4'){
                options['priority'] = '4';
            } else {

            }
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
                        if(req.user.role == 'admin' || req.user.role == 'operation manager'){
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
                                return (val.requested_by._id == req.user.id);
                            });
                        }

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
