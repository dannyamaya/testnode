var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ActivityLogSchema   = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required:true },
  activity: { type: String, required: true},
  entity: { type: String, required: true},
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
