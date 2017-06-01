var express = require('express');
var router = express.Router();
var CommentController = require('../controllers/CommentController');



router.route('/')
    .post(CommentController.createComment);

router.route('/discussion')
    .get(CommentController.readDiscussionComments);



module.exports = router;
