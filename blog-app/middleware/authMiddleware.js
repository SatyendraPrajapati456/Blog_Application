const Blog = require('../models/Blog');
const Comment = require('../models/Comment');

// The single NSS admin email — full disciplinary control
const ADMIN_EMAIL = 'sp5267062@gmail.com';

// Check if the current session user is the admin
const isAdmin = (req) => {
  return req.session && req.session.user && req.session.user.email === ADMIN_EMAIL;
};

// Ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  req.flash('error', 'Please log in to access this page.');
  res.redirect('/auth/login');
};

// Ensure user is NOT authenticated (for login/register pages)
const requireGuest = (req, res, next) => {
  if (req.session && req.session.userId) return res.redirect('/');
  next();
};

// Attach current user + admin flag to res.locals (runs on every request)
const attachUser = (req, res, next) => {
  res.locals.currentUser    = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.userId;
  res.locals.isAdmin        = isAdmin(req);          // available in every EJS view
  res.locals.successMsg     = req.flash('success');
  res.locals.errorMsg       = req.flash('error');
  next();
};

// Ensure current user is the blog author OR the admin
const requireBlogAuthor = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      req.flash('error', 'Blog not found.');
      return res.redirect('/');
    }
    // Admin bypasses ownership check
    if (isAdmin(req) || blog.author.toString() === req.session.userId.toString()) {
      req.blog = blog;
      return next();
    }
    req.flash('error', 'You are not authorised to perform this action.');
    res.redirect(`/blogs/${blog._id}`);
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('/');
  }
};

// Ensure current user is the comment author OR the admin
const requireCommentAuthor = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      req.flash('error', 'Comment not found.');
      return res.redirect('back');
    }
    // Admin bypasses ownership check
    if (isAdmin(req) || comment.author.toString() === req.session.userId.toString()) {
      req.comment = comment;
      return next();
    }
    req.flash('error', 'You are not authorised to delete this comment.');
    res.redirect('back');
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('back');
  }
};

// Guard: only admin may access admin-only routes
const requireAdmin = (req, res, next) => {
  if (isAdmin(req)) return next();
  req.flash('error', 'Access denied. Admins only.');
  res.redirect('/');
};

module.exports = { requireAuth, requireGuest, attachUser, requireBlogAuthor, requireCommentAuthor, requireAdmin, isAdmin };
