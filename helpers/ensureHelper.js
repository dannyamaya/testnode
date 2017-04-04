var express = require('express');
var passport = require('passport');
var router = express.Router();

module.exports = {
    ensureRedirect: function (req, res, next) {

        if (req.isAuthenticated()) {
            if (req.user.hasRole('admin')) {
                return res.redirect('/users');
            } else if (req.user.hasRole('user')) {
                return res.redirect('/dashboard');
            } else {
                return res.redirect('/login');
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

    ensureUser: function(req,res,next){
        if (req.isAuthenticated()) {
            if ( req.user.hasRole('user') || req.user.hasRole('admin') ){
                return next();
            } else {
                return res.redirect('/');
            }
        }
        return res.redirect('/');
    }
};