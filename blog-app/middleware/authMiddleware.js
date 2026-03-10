const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// Ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/auth/login');
};

// Ensure user is NOT authenticated (for login/register pages)
const requireGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  next();
};

// Attach current user to res.locals (runs on every request)
const attachUser = (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.userId;
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  next();
};

// Ensure current user is the blog author
const requireBlogAuthor = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      req.flash('error', 'Blog not found.');
      return res.redirect('/');
    }
    if (blog.author.toString() !== req.session.userId) {
      req.flash('error', 'You are not authorized to perform this action.');
      return res.redirect(`/blogs/${blog._id}`);
    }
    req.blog = blog;
    next();
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('/');
  }
};

// Ensure current user is the comment author
const requireCommentAuthor = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      req.flash('error', 'Comment not found.');
      return res.redirect('back');
    }
    if (comment.author.toString() !== req.session.userId) {
      req.flash('error', 'You are not authorized to delete this comment.');
      return res.redirect('back');
    }
    req.comment = comment;
    next();
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('back');
  }
};

module.exports = { requireAuth, requireGuest, attachUser, requireBlogAuthor, requireCommentAuthor };
