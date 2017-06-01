var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TicketSchema   = new Schema({

  filed_by:  { type: Schema.Types.ObjectId, ref: 'User', required:true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' , required:true},
  assigned_to: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  location: {type: String, required:true},

  subject: { type: String, required: true},
  category: {type: String},
  subcategory: {type: String},

  message: { type: String, required: true},
  priority: { type: Number, required: true, default:1},
  status: { type: Number, required: true, default:0},
  replies: [{ type: Schema.Types.ObjectId, ref: 'Ticket'}],
  attachments: { type: String, default:'' },

  file_name: {type:String, default: ''},

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
