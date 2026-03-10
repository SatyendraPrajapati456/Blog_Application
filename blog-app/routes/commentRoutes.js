const express = require('express');
const router = express.Router({ mergeParams: true });
const { postComment, deleteComment } = require('../controllers/commentController');
const { requireAuth, requireCommentAuthor } = require('../middleware/authMiddleware');

router.post('/', requireAuth, postComment);
router.delete('/:commentId', requireAuth, requireCommentAuthor, deleteComment);

module.exports = router;
