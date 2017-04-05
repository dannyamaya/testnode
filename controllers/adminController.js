

var Application = require('../models/application.js');

module.exports = {
    index: function(req,res,next){
        res.render('admin/user/index', {
            title: 'Users',
            user: req.user,
            logged: req.isAuthenticated()
        });

    }

}


