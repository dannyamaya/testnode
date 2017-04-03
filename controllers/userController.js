var mailer = require('../../mailers/mailer');
var User = require('../models/user.js');

module.exports = {

	/**
	 * Creates a new user.
	 * @param {string} name - The user's name.
	 * @param {string} email - The user's email.
	 * @param {string} password - The user's password.
	 * @param {string} passwordconf - The user's password confirmation, verification purposes.
	 */
	createUser: function(req, res, next) { 
	    if (req.body.name === undefined) {
	        res.status(404).json({ message: 'name not found'});
	    }
	    if (req.body.email === undefined  ) {
	        res.status(404).json({ message: 'email not found'});
	    }
	    if (req.body.password === undefined  ) {
	        res.status(404).json({ message: 'password not found'});
	    }
	    if (req.body.passwordconf === undefined  ) {
	        res.status(404).json({ message: 'passwordconf not found'});
	    }

	    var pswd = req.body.password;
	    var pswd_conf = req.body.passwordconf;
	    
	    if(pswd == pswd_conf){

	        var user = new User({
	            name:     req.body.name,
	            email:    req.body.email,
	            password: req.body.password
	        });

	        user.save(function(err) {
	            if(!err) {
	                console.log('New user has been created');
	                req.user = user;
	                mailer.welcome(user);   
	                req.login(user, function(err) {
	                    if (err) {
	                        console.log(err);
	                    }
	                    res.status(200).json({ message: "User has been created"});
	                });
	                
	            } else {
	                console.log('ERROR: ' + err);
	                res.status(201).json({ message: "User already exists"});
	            }
	        });   
	    } else {
	        res.status(400).json({ message: 'password and password confirmation mismatch'});   
	    }
	},

	 /**
     * Reads all users.
     * @param {string} page - The user's name.
     * @param {string} search - The user's email.
     */
    readUsers: function(req, res, next) {

        var page = req.query.page || 1;
        var search = req.query.search || '';
        User.find({ roles: { $nin: [ "admin" ] } }).or([
                { 
                    'name.first': new RegExp(search, 'i') 
                }, 
                {   
                    'name.last': new RegExp(search, 'i') 
                },
                {   
                    email: new RegExp(search, 'i') 
                }
            ])
            .sort({created: -1}).limit(10).skip((page-1)*10).exec(function(err,users) {
                if (err){
                    console.log('ERROR: ' + err);
                    res.status(500).json({ err: err, message: "Internal Server Error"});
                } else {  
                    res.status(200).json({ users: users, page:page }); 
                }                   
            });
    },

	/**
     * Updates user.
     * @param {string} id - The user's id.
     */
	updateUser: function(req, res , next) {
        User.findById(req.params.id, function(err, user){
            if (err){
                res.status(500).json({message:'Internal Server Error'});
            }
            if(!user){
                res.status(404).json({message:'User not found'});
            } else {
              user.name = req.body.name || user.name;
              user.company = req.body.company || user.company;
              user.phone = req.body.phone || user.phone;
              user.address1 = req.body.address1 || user.address1;
              user.address2 = req.body.address2 || user.address2;
              user.email = req.body.email || user.email;
              if(user.email != req.body.email){
                verified_email = false;
              }              
              user.updated = Date.now();

              if(user.email!=req.body.email){
                user.email = req.body.email || user.email;
              } 

              user.save(function (err, u) {
                    if(err) {
                        res.status(500).json({message:'Internal Server Error'});
                    } else {
                        res.status(200).json({user:{ name : u.name,
                                                     company : u.company,
                                                     phone : u.phone,
                                                     address1: u.address1,
                                                     address2: u.address2,
                                                     email : u.email,
                                                     verified_email: u.verified_email
                                                    }
                                            });
                    }
              });                
                          
            }
        });
    },

    /**
     * Deletes user.
     * @param {string} id - The user's id.
     */
    deleteUsers: function(req,res,next) {

        User.remove({ _id : { $in: req.body.users } }, function(err) {
            if (err){
                console.log('ERROR: ' + err);
                return res.status(500).json({error:true, message:'Server connection error. Please try later'});
            }else{
                return res.status(200).json({error: false, message: 'User has been removed'});
            }
        });
    },

    /**
     * Send password reset message.
     * @param {string} email - users email.
     */
	resetPassword: function(req,res,next){
	    User.findOne({email:req.body.email}, function(err, user){
	        if (err) return next(err);
	        if(!user){
	            res.status(404).json({ message:'User not found' });
	        } else {
	            user.reset_password_token = crypto.randomBytes(48).toString('base64').replace(/\//g, '_').replace(/\+/g, '-')
	            user.reset_password_sent_at = Date.now();
	            user.save(function(err) {
	                if(!err) {
	                    mailer.resetPassword(user);              
	                    res.status(200).json({ message:'Instructions has been sent to your email' });      
	                } else {
	                    res.status(500).json({ message:'Internal Server Error' }); 
	                }
	            });                                             
	        }
	    });
	},

	/**
	 * Update password.
	 * @param {string} password - new password.
	 * @param {string} passwordconfirmation - new password confirmation.
	 */
	updatePassword: function(req,res,next) {

	    if (req.body.password === undefined) {
	        res.status(404).json({ message: 'password not found'});
	    }

	    if (req.body.passwordconfirmation === undefined) {
	        res.status(404).json({ message: 'password confirmation not found'});
	    }
	    
	    if(req.body.password == req.body.passwordconfirmation ){

	        User.findById(req.body.id, function(err, user){
	           if (err) {
	                res.status(404).json({message: "User not found"});
	           }
	           if(!user){
	               res.status(404).json({message: "User not found"});
	           } else {
	                if(user.hash && user.salt){
	                    if(user.reset_password_token == req.body.reset_password_token ){
	                        res.status(422).json({ message: "Lo sentimos este link ya caduco. Intenta hacer una solicitud de nuevo"});
	                    } else {
	                        user.password = req.body.password;
	                        user.save();
	                        res.status(200).json({  message: "Tu contraseña ha sido modificada exitosamente"});
	                    }                     
	                } else{
	                    user.password = req.body.password;
	                    user.save();
	                    res.status(200).json({message: "Password updated"});
	                }                           
	           }
	        });

	    } else {
	        res.status(400).json({ message: 'password and password confirmation mismatch'});
	    }
	}

};