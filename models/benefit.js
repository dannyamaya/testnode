var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BenefitSchema = new Schema({
    title: { type: String, required: true },
    benefits: [{ type:String }],
    ally: { type:String },
    image: { type:String }
});

module.exports = mongoose.model('Benefit', BenefitSchema);
