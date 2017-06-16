var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TicketSchema   = new Schema({

  id: { type:Number},
  requested_by:  { type: Schema.Types.ObjectId, ref: 'User', required:true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User' , required:true},
  assigned_to: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  location: {type: String, required:true},

  subject: { type: String, required: true},
  category: {type: String},
  subcategory: {type: String},

  message: { type: String, required: true},
  priority: { type: Number, required: true, default:4},
  status: { type: Number, required: true, default:0},
  replies: [{ type: Schema.Types.ObjectId, ref: 'Ticket'}],
  attachments: { type: String, default:'' },

  file_name: {type:String, default: ''},

  opened: {type:Boolean, required:true, default:false},
  opened_resident: {type:Boolean, required:true, default:false},

  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  closed: { type: Date , default: Date.now }
});

TicketSchema.pre('save', function(next) {
    if(this.isNew){
        var doc = this;
        this.constructor.find({location: this.location}).sort({id:-1}).exec(function(error, found)   {
            if(error)
                return next(error);
            if(found[0]){
                doc.id  = found[0].id+1;
            } else {
                doc.id = 1;
            }
            next();
        });
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);
