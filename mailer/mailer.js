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
        //url: config.url.test,
        url: config.url.production,
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

                  from: 'Notaria'+' <contact@cannedhead.com>',
                  to: locals.user.email,
                  subject: 'Bienvenido',
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