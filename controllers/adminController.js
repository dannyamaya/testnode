module.exports = {
    users: function(req,res,next){
        res.render('admin/user/index', {
            title: 'Users',
            user: req.user,
            logged: req.isAuthenticated()
        });

    },

    tickets: function(req,res,next){
        res.render('admin/ticket/index', {
            title: 'Tickets',
            user: req.user,
            logged: req.isAuthenticated()
        });

    }

}


