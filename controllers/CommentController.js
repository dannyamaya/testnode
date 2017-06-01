var Comment = require('../models/comment.js'),
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


        var comment = new Comment({
            discussion_id: req.body.discussion_id,
            posted_by: req.body.posted_by,
            comment: req.body.comment,

        });


        comment.save(function (err, t) {
            if (!err) {
                Comment.populate(t,{ path:'discussion_id',populate:{path:'filed_by'} },function(error,tpopulated){
                    mailer.newComment(tpopulated);
                    console.log('New comment has been created');
                });
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
                    console.log(comment);

                    return res.status(200).json({comment: comment});
                }
            });
    }

}
