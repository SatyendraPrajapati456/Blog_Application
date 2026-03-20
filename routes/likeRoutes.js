const express = require('express');
const router  = express.Router({ mergeParams: true });
const Like    = require('../models/Like');
const { requireAuth } = require('../middleware/authMiddleware');

// POST /blogs/:id/like  — toggle like
router.post('/', requireAuth, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.session.userId;
  try {
    const existing = await Like.findOne({ blog: blogId, user: userId });
    if (existing) {
      await existing.deleteOne();
    } else {
      await Like.create({ blog: blogId, user: userId });
    }
    // Respond with updated count (AJAX-friendly)
    const count = await Like.countDocuments({ blog: blogId });
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ liked: !existing, count });
    }
    res.redirect(`/blogs/${blogId}`);
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Failed to toggle like.' });
    }
    res.redirect(`/blogs/${blogId}`);
  }
});

module.exports = router;
