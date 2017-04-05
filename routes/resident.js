var express = require('express');
var router = express.Router();
var residentController = require('../controllers/residentController');

// router.route('/')
//     .get(residentController.readResidents)
//     .delete(residentController.deleteResidents);

router.route('/:id')
    .get(residentController.readResident);


module.exports = router;


