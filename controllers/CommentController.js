var Comment = require('../models/comment.js'),
    Ticket = require('../models/ticket.js'),
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


    createComment: function (req, res, next) {

        if (req.body.discussion_id === undefined) {
            return res.status(404).json({message: 'Ticket not found'});
        }

        if (req.body.posted_by === undefined) {
            return res.status(404).json({message: 'Posted by not found'});
        }

        if (req.body.comment === undefined) {
            return res.status(404).json({message: 'comment not found'});
        }

        let file = req.files.attachments;
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


        let comment = new Comment({
            discussion_id: req.body.discussion_id,
            posted_by: req.body.posted_by,
            comment: req.body.comment,
            attachments: imagenUrl || '',
            file_name: file_name

        });

        comment.save(function (err, t) {
            if (!err) {
                Comment.populate(t, {
                    path: 'discussion_id',
                    populate: {path: 'requested_by'}
                }, function (error, tpopulated) {
                    mailer.newComment(tpopulated);
                    console.log('New comment has been created');
                });

                //Como es un nuevo comentario vacia el arreglo de leido por del ticket y agrega el usuario actual
                Ticket.findById(req.body.discussion_id, function (err, ticket) {
                    if (err) {
                        console.log('ERROR: ' + err);
                        return res.status(500).json({err: err});
                    }
                    if (!ticket) {
                        return res.status(404).json({message: 'Ticket not found'});
                    } else {


                        //Agrega usuario al arreglo de leido por

                        ticket.readed_by = [];
                        ticket.readed_by.push(req.body.posted_by);
                        ticket.updated = Date.now();

                        ticket.save(function (err) {
                            if (!err) {

                            } else {
                                console.log('ERROR: ' + err);
                                return res.status(500).json({err: err});
                            }
                        });
                    }
                });
                return res.status(200).json({comment: t, message: "Comment has been created"});
            }
            else {
                console.log(err);
            }
        });

    },

    readDiscussionComments: function (req, res, next) {

        Comment.find({'discussion_id': req.query.ticket})
            .populate('posted_by', 'email profile_picture name')
            .exec(function (err, comment) {
                if (err) {
                    console.log('ERROR: ' + err);
                    return res.status(500).json({err: err, message: "Internal Server Error"});
                }
                if (!comment) {
                    return res.status(404).json({message: "User not found"});
                } else {
                    //console.log(comment);

                    return res.status(200).json({comment: comment});
                }
            });
    }

}
