var express = require('express');
var router = express.Router();
var NoteController = require('../controllers/NoteController');



router.route('/')
    .post(NoteController.createNote);

router.route('/discussion')
    .get(NoteController.readDiscussionNotes);



module.exports = router;
