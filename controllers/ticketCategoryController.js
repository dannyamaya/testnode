var TicketCategory = require('../models/ticketCategory.js');
var ObjectId = require('mongoose').Types.ObjectId;


    // https://github.com/aheckmann/gm - imagemagic

var AWS_PREFIX = 'https://s3-sa-east-1.amazonaws.com/cannedhead.livinn/';



module.exports = {

    /**
     * Creates a new ticket category.
     */
    createTicketCategory: function (req, res, next) {

        if (!req.body.name || req.body.name === undefined) {
            return res.status(404).json({message: 'name not found'});
        }

        if (!req.body.responsable || req.body.responsable === undefined) {
            return res.status(404).json({message: 'responsable not found'});
        }

        var newticketcat = new TicketCategory({
            responsable: req.body.responsable,
            name: req.body.name,
            parent: req.body.parent
        });

        newticketcat.save(function (err, t) {
            if (!err) {
                return res.status(200).json({ticket: t, message: "New ticket category has been created"});
            } else {
                console.log('ERROR: ' + err);
                return res.status(500).json({err: err});
            }
        });
    },

    /**
     * Returns ticket categories
     */
    readTicketCategories: function (req, res, next) {

            if(req.query.category){
                TicketCategory.findOne({ name: new RegExp(req.query.category, 'i') }).exec(function(err, category){
                    if(!category){
                        return res.status(404).json({error: true, message: 'Category not found'});
                    } else {
                        TicketCategory.find({parent: category._id}).exec(function(err, subcategories){
                            if (err) {
                                console.log('ERROR: ' + err);
                                return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
                            } else {
                                return res.status(200).json({error: false, categories: subcategories });
                            }
                        });
                    }
                });
            } else {
                TicketCategory.find({parent: {$exists: false}})
                .sort({created: -1}).exec(function (err, ticketscategories) {
                    if (err) {
                        console.log('ERROR: ' + err);
                        return res.status(500).json({error: true, message: 'Server connection error. Please try later'});
                    } else {
                        return res.status(200).json({error: false, categories: ticketscategories });
                    }
                });
            }
    },



}
