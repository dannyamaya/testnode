var express = require('express');
var passport = require('passport');
var router = express.Router();

module.exports = {
    ensureRedirect: function (req, res, next) {

        if (req.isAuthenticated()) {
            if ( req.user.hasRole('admin') || req.user.hasRole('operation manager') ) {
                return res.redirect('/users');
            } else if ( req.user.hasRole('marketing') || req.user.hasRole('maintenance') || req.user.hasRole('client service') || req.user.hasRole('resident assistant') ) {
                return res.redirect('/tickets');
            } else if (req.user.hasRole('resident')) {
                return res.redirect('/resident/tickets');
            } else {
                return res.redirect('/');
            }
        }
        else {
            return next();
        }
    },

    ensureAdmin: function(req,res,next){
        if (req.isAuthenticated()) {
            if (req.user.hasRole('admin')) {
                return next();
            } else {
                return res.redirect('/');
            }
        }
        return res.redirect('/');
    },

    ensureAdminAndOperationManager: function(req,res,next){
        if (req.isAuthenticated()) {
            if (req.user.hasRole('admin') || req.user.hasRole('operation manager')) {
                return next();
            } else {
                return res.redirect('/');
            }
        }
        return res.redirect('/');
    },

    ensureLivinn: function(req,res,next){
        if (req.isAuthenticated()) {
            if (req.user.hasRole('admin') || req.user.hasRole('marketing') || req.user.hasRole('operation manager') || req.user.hasRole('maintenance') || req.user.hasRole('client service') || req.user.hasRole('resident assistant') ) {
                return next();
            } else {
                return res.redirect('/');
            }
        }
        return res.redirect('/');
    },

    ensureResident: function(req,res,next){
        if (req.isAuthenticated()) {
            if ( req.user.hasRole('resident') ){
                return next();
            } else {
                return res.redirect('/');
            }
        }
        return res.redirect('/');
    }
};
