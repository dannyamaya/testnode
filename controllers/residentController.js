var Resident = require('../models/resident.js');

module.exports = {
    readResident: function(req,res,next){
        Resident.findOne({user_id:req.params.id}, function (err, resident) {
            if (err) return next(err);
            if (!user) {
                return res.status(404).json({message: 'Resident not found'});
            } else {
                return res.status(200).json({message: 'Resident Founded', resident:resident});
            }
        });

    }

}


