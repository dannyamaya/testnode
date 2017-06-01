var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');
var ticketController = require('../controllers/ticketController');

/* GET users listing. */
router.route('/')
    .get(userController.readUsers)
    .post(userController.createUser)
    .put(userController.updateUser)
    .delete(userController.deleteUsers);

router.route('/export')
    .get(userController.exportUsers);

router.route('/:id')
    .put(userController.updateUser)
    .get(userController.readUser);

router.route('/:id/tickets')
    .get(ticketController.readTicketsByUserId);

router.route('/autocomplete')
    .post(userController.autocompleteUsers);

module.exports = router;


