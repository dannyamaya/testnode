var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

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
    rateusd: {type: String},
    agent: {type: String, required:true},
    finish: {type: Date, required:true},
    start: {type: Date, required:true},

    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    active: {type: String, default: true}

}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

ResidentSchema.virtual('duration')
    .get(function () {
      var date1  = this.start;
      var date2 = this.finish;

      var timeDiff = Math.abs(date2.getTime() - date1.getTime());
      var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

      return diffDays;

    });


module.exports = mongoose.model('Resident', ResidentSchema);

