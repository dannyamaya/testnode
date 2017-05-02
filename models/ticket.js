var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TicketSchema   = new Schema({ 
  client_id: { type: Schema.Types.ObjectId, ref: 'User', required:true },
  subject: { type: String, required: true},
  message: { type: String, required: true},
  priority: { type: Number, required: true, default:0},
  status: { type: Number, required: true, default:0},
  assigned_to: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  replies: [{ type: Schema.Types.ObjectId, ref: 'Ticket'}],
  attachments: { type: String, default:'' },
  category: {type: String},
  filedby:   {type: String},
  file_name: {type:String, default: ''},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);