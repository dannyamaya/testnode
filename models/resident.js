var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ResidentSchema = new Schema({
    user_id:{type:Schema.Types.ObjectId, ref: 'User', required:true},
    contract_number: {type: String, required: true, unique: true, lowercase: true, trim: true},
    birth_date: {type: Date},
    apartment: {type: String, required:true},
    bed: {type: String},
    apartment_type: {type: String, required:true},
    bathroom:{type:String},
    status:{type:String},
    rate: {type: String, required:true},
    currency: {type: String, required:true},
    rateusd: {type: String, required:true},
    agent: {type: String, required:true},
    finish: {type: Date, required:true},
    start: {type: Date, required:true},
    duration: {type: String, required:true},

    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    active: {type: String, default: true},

}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});


module.exports = mongoose.model('Resident', ResidentSchema);

