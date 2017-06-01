var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommunicationSchema = new Schema({
    title: { type: String, required: true },
    description: { type:String, required:true },
    image: { type:String }
});

module.exports = mongoose.model('Communication', CommunicationSchema);

