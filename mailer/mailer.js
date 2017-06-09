'use strict';

var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', 'views/email-templates');
var emailTemplates = require('email-templates');
var config = require('../config/config.json');

var transport = nodemailer.createTransport("SMTP", {
    host: "smtp.sendgrid.com",
    port: 587,
    secure: false, // use SSL
    auth: {
        user: 'contact@cannedhead.com',
        pass: 'E479d036b6!'
    }
});

exports.welcome= function(user){

    var locals = {
        url: config.production.url,
        user: {
          id: user._id ,
          name:  user.name,
          email_token: user.email_token,
          email: user.email
        }
    };

    emailTemplates(templatesDir,locals, function(err, template) {

        if (err) {
          console.log('Error1: '+err);
        } else {

          template('welcome', locals, function(err, html, text) {
            if (err) {
              console.log('Error2: '+err);
            } else {

              var mailOptions = {

                  from: 'Livinn'+' <contact@cannedhead.com>',
                  to: locals.user.email,
                  subject: 'Welcome',
                  headers: {
                      'X-Laziness-level': 1000
                  },
                  html: html

              };

              transport.sendMail(mailOptions, function(error, response){
                  if(error){
                    console.log(error);
                  }else{
                    console.log("Message sent!");
                  }
                  transport.close();
              });
            }

          });
        }

      });
},

exports.resetPassword= function(user){

    var locals = {
        url: config.production.url,
        user: {
          id: user._id ,
          name:  user.name,
          email_token: user.reset_password_token,
          email: user.email,
          sent_at: user.reset_password_sent_at
        }
    };


    emailTemplates(templatesDir,locals, function(err, template) {

        if (err) {
          console.log('Error1: '+err);
        } else {

          template('reset-password', locals, function(err, html, text) {
            if (err) {
              console.log('Error2: '+err);
            } else {

              var mailOptions = {

                  from: 'Livinn'+' <contact@cannedhead.com>',
                  to: locals.user.email,
                  subject: 'Reset your password',
                  headers: {
                      'X-Laziness-level': 1000
                  },
                  html: html

              };

              transport.sendMail(mailOptions, function(error, response){
                  if(error){
                    console.log(error);
                  }else{
                    console.log("Message sent!");
                  }
                  transport.close();
              });
            }

          });
        }

      });
},

exports.newTicket= function(ticket){

    var locals = {
        url: config.production.url,
        ticket: ticket
    };

    emailTemplates(templatesDir,locals, function(err, template) {

        if (err) {
          console.log('Error1: '+err);
        } else {

          template('new-ticket', locals, function(err, html, text) {
            if (err) {
              console.log('Error2: '+err);
            } else {

              var mailOptions = {

                  from: 'Livinn'+' <contact@cannedhead.com>',
                  to: locals.ticket.requested_by.email,
                  subject: 'New Work Order #'+ticket._id,
                  headers: {
                      'X-Laziness-level': 1000
                  },
                  html: html

              };

              transport.sendMail(mailOptions, function(error, response){
                  if(error){
                    console.log(error);
                  }else{
                    console.log("Message sent!");
                  }
                  transport.close();
              });
            }

          });
        }

      });
},

    exports.newComment = function(comment){

        var locals = {
            url: config.production.url,
            comment: comment
        };

        emailTemplates(templatesDir,locals, function(err, template) {

            if (err) {
                console.log('Error1: '+err);
            } else {

                template('new-comment', locals, function(err, html, text) {
                    if (err) {
                        console.log('Error2: '+err);
                    } else {
                        var mailOptions = {

                            from: 'Livinn'+' <contact@cannedhead.com>',
                            to: locals.comment.discussion_id.requested_by.email,
                            subject: 'New Comment '+ locals.comment.discussion_id._id,
                            headers: {
                                'X-Laziness-level': 1000
                            },
                            html: html

                        };

                        transport.sendMail(mailOptions, function(error, response){
                            if(error){
                                console.log(error);
                            }else{
                                console.log("Message sent!");
                            }
                            transport.close();
                        });
                    }

                });
            }

        });



    },

    exports.newAssignedTo = function(user,ticket){


        var locals = {
            url: config.production.url,
            user: user,
            ticket: ticket
        };


        emailTemplates(templatesDir,locals, function(err, template) {

            if (err) {
                console.log('Error1: '+err);
            } else {

                template('new-assigned', locals, function(err, html, text) {
                    if (err) {
                        console.log('Error2: '+err);
                    } else {
                        var mailOptions = {

                            from: 'Livinn'+' <contact@cannedhead.com>',
                            to: locals.user.email,
                            subject: 'A ticket has been assigned to you '+ locals.ticket._id,
                            headers: {
                                'X-Laziness-level': 1000
                            },
                            html: html

                        };

                        transport.sendMail(mailOptions, function(error, response){
                            if(error){
                                console.log(error);
                            }else{
                                console.log("Message sent!");
                            }
                            transport.close();
                        });
                    }

                });
            }

        });



    }

