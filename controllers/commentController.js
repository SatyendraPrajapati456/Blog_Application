const Comment = require('../models/Comment');
const Blog    = require('../models/Blog');
const { isAdmin } = require('../middleware/authMiddleware');

// POST /blogs/:id/comments
const postComment = async (req, res) => {
  const { text }  = req.body;
  const blogId    = req.params.id;
  if (!text || text.trim().length === 0) {
    req.flash('error', 'Comment cannot be empty.');
    return res.redirect(`/blogs/${blogId}`);
  }
  if (text.trim().length > 1000) {
    req.flash('error', 'Comment cannot exceed 1000 characters.');
    return res.redirect(`/blogs/${blogId}`);
  }
  try {
    const blog = await Blog.findById(blogId);
    if (!blog) { req.flash('error', 'Blog not found.'); return res.redirect('/'); }
    await Comment.create({ text: text.trim(), author: req.session.userId, blog: blogId });
    req.flash('success', 'Comment added!');
    res.redirect(`/blogs/${blogId}`);
  } catch (err) {
    req.flash('error', 'Failed to add comment.');
    res.redirect(`/blogs/${blogId}`);
  }
};

// DELETE /blogs/:id/comments/:commentId
const deleteComment = async (req, res) => {
  const blogId  = req.params.id;
  const byAdmin = isAdmin(req) && req.comment.author.toString() !== req.session.userId.toString();
  try {
    await req.comment.deleteOne();
    req.flash('success', byAdmin ? '🚨 Comment removed by NSS Admin.' : 'Comment deleted.');
    res.redirect(`/blogs/${blogId}`);
  } catch (err) {
    req.flash('error', 'Failed to delete comment.');
    res.redirect(`/blogs/${blogId}`);
  }
};

module.exports = { postComment, deleteComment };
