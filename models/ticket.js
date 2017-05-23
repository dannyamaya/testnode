var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TicketSchema   = new Schema({
  //requestor
  client_id: { type: Schema.Types.ObjectId, ref: 'User', required:true },
  //requestby
  filedby:  { type: Schema.Types.ObjectId, ref: 'User', required:true },
  //assignee
  request_by: { type: Schema.Types.ObjectId, ref: 'User' },
  assignee: [{ type: Schema.Types.ObjectId, ref: 'User' }],


  subject: { type: String, required: true},
  category: {type: String},
  subcategory: {type: String},

  message: { type: String, required: true},
  priority: { type: Number, required: true, default:0},
  status: { type: Number, required: true, default:0},
  replies: [{ type: Schema.Types.ObjectId, ref: 'Ticket'}],
  attachments: { type: String, default:'' },

  file_name: {type:String, default: ''},

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
