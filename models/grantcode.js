var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uid = require('uid2');

var GrantCodeSchema = new Schema({
    code: { type: String, unique: true, default: function() {
            return uid(24);
        }
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    application: { type: Schema.Types.ObjectId, ref: 'Application' },
    scope: [ { type: String } ],
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('GrantCode', GrantCodeSchema);
