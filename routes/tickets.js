var express = require('express');
var router = express.Router();
var ticketController = require('../controllers/ticketController');



router.route('/')
    .get(ticketController.readTickets)
    .post(ticketController.createTicket)
    .put(ticketController.updateTicket)
    .delete(ticketController.deleteTicket);

router.route('/:id')
    .get(ticketController.readTicket);

module.exports = router;
