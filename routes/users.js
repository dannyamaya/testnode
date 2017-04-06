var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController');

/* GET users listing. */
router.route('/')
    .get(userController.readUsers)
    .post(userController.createUser)
    .put(userController.updateUser)
    .delete(userController.deleteUsers);

router.route('/:id')
    .put(userController.updateUser)
    .get(userController.readUser);


module.exports = router;


