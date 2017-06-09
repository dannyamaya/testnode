var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentsSchema   = new Schema({
  discussion_id:{ type: Schema.Types.ObjectId, ref: 'Ticket', required:true },
  posted_by: { type: Schema.Types.ObjectId, ref: 'User', required:true },
  comment: { type: String, required: true},
  attachments: { type: String, default:'' },
  file_name: { type: String, default:'' },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentsSchema);
