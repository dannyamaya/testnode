var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uid = require('uid2');

var AccessTokenSchema = new Schema({
    token: { type: String, unique: true, default: function() {
            return uid(124);
        }
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    application: { type: Schema.Types.ObjectId, ref: 'Application' },
    grant: { type: Schema.Types.ObjectId, ref: 'GrantCode' },
    scope: [ { type: String }],
    expires: { type: Date, default: function(){
        var today = new Date();
        var length = 60; // Length (in minutes) of our access token
        return new Date(today.getTime() + length*60000);
    } },
    active: { type: Boolean, get: function(value) {
        if (expires < new Date() || !value) {
            return false;
        } else {
            return value;
        }
    }, default: true }
});

module.exports = mongoose.model('AccessToken', AccessTokenSchema);
