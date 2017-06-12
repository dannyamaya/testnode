var express = require('express');
var router = express.Router();
var authenticationController = require('../controllers/authenticationController');
var adminController = require('../controllers/adminController');
var ensureHelper = require('../helpers/ensureHelper');
var userController = require('../controllers/userController');
var residentController = require('../controllers/residentController');

/* GET home page. */
router.get('/', ensureHelper.ensureRedirect, authenticationController.login);
router.post('/login', authenticationController.loginUser);

// Admin Routes
router.get('/users',ensureHelper.ensureLivinn, adminController.users);
router.get('/tickets',ensureHelper.ensureLivinn, adminController.tickets);

// Resident Routes
router.get('/resident/tickets',ensureHelper.ensureResident, residentController.tickets);




router.get('/logout',authenticationController.logout);

router.post('/update-password',userController.updatePassword);
router.get('/reset-password', userController.showResetPassword)
router.post('/reset-password', userController.resetPassword);
router.route('/welcome').get(userController.welcome);


/*=== SETTINGS ===*/
router.get('/settings/personal-information', function(req, res) {
  res.render('admin/user/personalinformation', {
      title:'Personal Information',
      user: req.user
  });
});

router.get('/settings/update-password', function(req, res) {
  res.render('admin/user/updatepassword', {
      title:'Update password',
      user: req.user
  });
});

/*=== SUPPORT ===*/
router.get('/support', function(req, res) {
  res.render('support', {
      title:'Support',
      user: req.user
  });
});

module.exports = router;
