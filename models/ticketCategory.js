var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TicketCategorySchema   = new Schema({
  responsable: {type:String , required:true ,trim: true, lowercase:true },
  name: {type:String , required:true ,trim: true, lowercase:true },
  parent: {type: Schema.ObjectId, ref: 'TicketCategory'},
  children:[{type: Schema.ObjectId, ref: 'TicketCategory'}],
  active: {type:Boolean, default:true},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TicketCategory', TicketCategorySchema);
