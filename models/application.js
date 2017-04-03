var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uid = require('uid2');

var ApplicationSchema = new Schema({
    title: { type: String, required: true },
    oauth_id: { type: Number, unique: true },
    oauth_secret: { type: String, unique: true, default: function() {
            return uid(42);
        }
    },
    domains: [ { type: String } ]
});

module.exports = mongoose.model('Application', ApplicationSchema);

