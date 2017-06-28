var express = require('express');
var router = express.Router();
var ticketCategoryController = require('../controllers/ticketCategoryController');



router.route('/')
    .get(ticketCategoryController.readTicketCategories)
    .post(ticketCategoryController.createTicketCategory);

module.exports = router;
