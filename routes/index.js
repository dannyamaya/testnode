var express = require('express');
var router = express.Router();
var authController = require('../controllers/authorizationController');
var adminController = require('../controllers/adminController');
var ensureHelper = require('../helpers/ensureHelper');


/* GET home page. */
router.get('/', ensureHelper.ensureRedirect, authController.login);
router.post('/login', authController.loginUser);

// Admin Routes
router.get('/users',ensureHelper.ensureAdmin, adminController.index);

router.get('/auth/start', authController.start);
router.post('/auth/finish', authController.finish);
router.post('/auth/exchange', authController.exchange);


module.exports = router;
