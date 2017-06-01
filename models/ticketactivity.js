var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TicketActivitySchema = new Schema({
    user_id : { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticket_id : { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    action: { type: String, required: true},
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TicketActivity', TicketActivitySchema);
