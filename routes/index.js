var express = require('express');
var router = express.Router();
var oauthController = require('../controllers/authorizationController');
var authenticationController = require('../controllers/authenticationController');
var adminController = require('../controllers/adminController');
var ensureHelper = require('../helpers/ensureHelper');


/* GET home page. */
router.get('/', ensureHelper.ensureRedirect, authenticationController.login);
router.post('/login', authenticationController.loginUser);

// Admin Routes
router.get('/users',ensureHelper.ensureAdmin, adminController.index);

// Authorization & authentication routes

/*router.get('/dialog/authorize', oauthController.authorization);
router.post('/dialog/authorize/decision', oauthController.decision);
router.post('/oauth/token', oauthController.token);*/


router.get('/api/me',oauthController.token);
router.get('/auth/start', oauthController.start);
router.post('/auth/finish', oauthController.finish);
router.post('/auth/exchange', oauthController.exchange);


router.get('/logout',authenticationController.logout);


module.exports = router;
