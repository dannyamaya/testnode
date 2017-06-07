var Note = require('../models/note.js'),
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


    createNote: function (req, res, next) {

        if (req.body.discussion_id === undefined) {
            return res.status(404).json({message: 'Ticket not found'});
        }

        if (req.body.posted_by === undefined) {
            return res.status(404).json({message: 'Posted by not found'});
        }

        if (req.body.note === undefined) {
            return res.status(404).json({message: 'Note not found'});
        }


        var note = new Note({
            discussion_id: req.body.discussion_id,
            posted_by: req.body.posted_by,
            note: req.body.note

        });


        note.save(function (err, t) {
            if (!err) {
                console.log('New note has been created')
            }
            else {
                console.log(err);
            }
        });


    },

    readDiscussionNotes: function (req, res, next) {

        Note.find({'discussion_id': req.query.ticket})
            .populate('posted_by', 'email profile_picture name')
            .exec(function (err, note) {
                if (err) {
                    console.log('ERROR: ' + err);
                    return res.status(500).json({err: err, message: "Internal Server Error"});
                }
                if (!note) {
                    return res.status(404).json({message: "Note not found"});
                } else {
                    console.log(note);
                    return res.status(200).json({note: note});
                }
            });
    }

}
