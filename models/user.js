var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var UserSchema = new Schema({
    name: {
        first: {type: String, lowercase: true, trim: true, required: true},
        last: {type: String, lowercase: true, trim: true, required: true}
    },
    profile_picture: {type: String, lowercase: true, trim: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    email_verified: {type: Boolean, default: false},
    email_token: {
        type: String,
        default: function () {
            return crypto.randomBytes(127).toString('hex').toString();
        },
        required: true, index: {unique: true}
    },
    email_token_sent_at: {type: Date, default: Date.now},

    phone: {
        number: {type: String, lowercase: true, trim: true},
        show: {type: Boolean, default: false}
    },

    doc: {
        typedoc:{type:String, default:'DNI'},
        number:{type:String, required:true, trim:true}
    },

    banned: {type: Boolean, default: false, required: true},
    hash: {type: String, default: ''},
    salt: {type: String, default: ''},

    reset_password_token: {
        type: String,
        default: function () {
            return crypto.randomBytes(127).toString('hex').toString();
        },
        required: true, index: {unique: true}
    },
    reset_password_sent_at: {type: Date, default: Date.now},
    time_zone: {type:String},
    occupation: {type:String},
    skype: {type:String},

    lastlogin: {type: Date, default: Date.now},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    role: {type: String, required: true},
    active: {type: String, default: true},
    location:{type:String, required:true}

}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});


/**
 * Virtuals
 */

UserSchema.virtual('password')
    .get(function () {
        return this._password;
    })
    .set(function (password) {
        this._password = password;
        var salt = this.salt = bcrypt.genSaltSync(10);
        this.hash = bcrypt.hashSync(password, salt);
    });

UserSchema.virtual('gravatar')
    .get(function () {
        var email = this.email;
        var hash = crypto.createHash('md5').update(email).digest('hex');
        var url = 'http://www.gravatar.com/avatar/' + hash + '?s=350';
        return url;
    });

/**
 * Methods
 */
UserSchema.statics.hashPassword = function (passwordRaw, fn) {
    var salt = this.salt = bcrypt.genSaltSync(10);
    bcrypt.hash(passwordRaw, salt, fn);
};

UserSchema.methods.verifyPassword = function (password, fn) {
    bcrypt.compare(password, this.hash, fn);
};

UserSchema.methods.hasRole = function (role) {
    var hasRole = false;

    if (this.role === role) {
        hasRole = true;
    }

    return hasRole;
};

/**
 * Validation
 */
// UserSchema.path('email').validate(function (email) {
//    var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
//    return emailRegex.test(email.text); // Assuming email has a text attribute
// }, 'The e-mail field cannot be empty.');

// UserSchema.path('phone.number').validate(function (phone) {
//    var phoneRegex = /^[0-9]*$/;
//    return phoneRegex.test(phone.text); // Assuming email has a text attribute
// }, 'The phone field is not a number.');


// User authentication method
UserSchema.static('authenticate', function (email, password, callback) {
    // Find a user in the database
    this.findOne({email: email}, function (err, user) {
        if (err) {
            return callback(err);
        }

        // Return false if no user found
        if (!user) {
            return callback(null, false, {message: "Email o Contraseña incorrecta"});
        } else {

            if (user.banned) {
                return callback(null, false, {message: 'Acceso denegado'});
            } else {
                // Verify password if user found
                user.verifyPassword(password, function (err, passwordCorrect) {
                    if (err) {
                        return callback(err);
                    }

                    // Return false if incorrect password
                    if (!passwordCorrect) {
                        return callback(null, false, {message: "Email o Contraseña incorrecta"});
                    }

                    // Return user if successful
                    return callback(null, user, null);
                });
            }
        }
    });
});

module.exports = mongoose.model('User', UserSchema);

