const Blog    = require('../models/Blog');
const Comment = require('../models/Comment');
const fs      = require('fs');
const path    = require('path');
const { isAdmin } = require('../middleware/authMiddleware');

const CATEGORIES = ['Technology', 'Programming', 'AI', 'Education', 'Lifestyle', 'Health', 'Business', 'Science', 'Other'];

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, '../public', imagePath);
  if (fs.existsSync(fullPath)) fs.unlink(fullPath, () => {});
};

const buildDateFilter = (timeFilter) => {
  const now = new Date();
  switch (timeFilter) {
    case 'today':  { const s = new Date(now); s.setHours(0,0,0,0);                    return { $gte: s }; }
    case 'week':   { const s = new Date(now); s.setDate(now.getDate() - 7);            return { $gte: s }; }
    case 'month':  { const s = new Date(now); s.setMonth(now.getMonth() - 1);          return { $gte: s }; }
    case 'year':   { const s = new Date(now); s.setFullYear(now.getFullYear() - 1);    return { $gte: s }; }
    default: return null;
  }
};

// GET /blogs
const getAllBlogs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip  = (page - 1) * limit;
    const { category, time, search } = req.query;

    const query = {};
    if (category && CATEGORIES.includes(category)) query.category = category;
    const dateFilter = buildDateFilter(time);
    if (dateFilter) query.createdAt = dateFilter;
    if (search && search.trim()) {
      query.$or = [
        { title:   { $regex: search.trim(), $options: 'i' } },
        { content: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit);

    res.render('index', {
      title: 'NSS Blog — All Stories', blogs,
      currentPage: page, totalPages: Math.ceil(total / limit),
      total, categories: CATEGORIES,
      activeCategory: category || '', activeTime: time || '', search: search || '',
    });
  } catch (err) {
    req.flash('error', 'Failed to load blogs.');
    res.render('index', {
      title: 'NSS Blog', blogs: [], currentPage: 1, totalPages: 1, total: 0,
      categories: CATEGORIES, activeCategory: '', activeTime: '', search: '',
    });
  }
};

// GET /blogs/my
const getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.session.userId }).sort({ createdAt: -1 });
    const commentCounts = await Comment.aggregate([
      { $match: { blog: { $in: blogs.map(b => b._id) } } },
      { $group: { _id: '$blog', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    commentCounts.forEach(c => { countMap[c._id.toString()] = c.count; });
    res.render('profile/myBlogs', { title: 'My Stories', blogs, countMap, categories: CATEGORIES });
  } catch (err) {
    req.flash('error', 'Failed to load your blogs.');
    res.redirect('/');
  }
};

// GET /blogs/new
const getCreateBlog = (req, res) =>
  res.render('createBlog', { title: 'Write a Story', blog: null, categories: CATEGORIES });

// POST /blogs
const postCreateBlog = async (req, res) => {
  const { title, content, category } = req.body;
  const cleanup = () => { if (req.file) deleteImageFile(`/uploads/${req.file.filename}`); };
  if (!title || !content)               { cleanup(); req.flash('error', 'Title and content are required.');       return res.redirect('/blogs/new'); }
  if (title.trim().length < 5)          { cleanup(); req.flash('error', 'Title must be at least 5 characters.');  return res.redirect('/blogs/new'); }
  if (content.trim().length < 20)       { cleanup(); req.flash('error', 'Content must be at least 20 characters.'); return res.redirect('/blogs/new'); }
  try {
    const blog = await Blog.create({
      title: title.trim(), content: content.trim(),
      author: req.session.userId,
      coverImage: req.file ? `/uploads/${req.file.filename}` : null,
      category: CATEGORIES.includes(category) ? category : 'Other',
    });
    req.flash('success', 'Your story has been published!');
    res.redirect(`/blogs/${blog._id}`);
  } catch (err) {
    cleanup();
    req.flash('error', err.name === 'ValidationError' ? Object.values(err.errors)[0].message : 'Failed to create blog.');
    res.redirect('/blogs/new');
  }
};

// GET /blogs/:id
const getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name email avatar');
    if (!blog) { req.flash('error', 'Blog not found.'); return res.redirect('/'); }
    const comments = await Comment.find({ blog: blog._id })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    const adminUser   = isAdmin(req);
    const isAuthor    = req.session.userId && blog.author._id.toString() === req.session.userId.toString();
    const canManage   = isAuthor || adminUser;   // author OR admin can edit/delete

    res.render('blogDetail', { title: blog.title, blog, comments, isAuthor, canManage, isAdmin: adminUser });
  } catch (err) {
    req.flash('error', 'Blog not found.');
    res.redirect('/');
  }
};

// GET /blogs/:id/edit
const getEditBlog = (req, res) =>
  res.render('createBlog', { title: 'Edit Story', blog: req.blog, categories: CATEGORIES });

// PUT /blogs/:id
const putUpdateBlog = async (req, res) => {
  const { title, content, category, removeImage } = req.body;
  const blog = req.blog;
  if (!title || !content) {
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    req.flash('error', 'Title and content are required.');
    return res.redirect(`/blogs/${blog._id}/edit`);
  }
  try {
    blog.title    = title.trim();
    blog.content  = content.trim();
    blog.excerpt  = '';
    if (CATEGORIES.includes(category)) blog.category = category;
    if (req.file) {
      deleteImageFile(blog.coverImage);
      blog.coverImage = `/uploads/${req.file.filename}`;
    } else if (removeImage === 'true') {
      deleteImageFile(blog.coverImage);
      blog.coverImage = null;
    }
    await blog.save();
    const byAdmin = isAdmin(req) && blog.author.toString() !== req.session.userId.toString();
    req.flash('success', byAdmin ? '✅ Blog updated by NSS Admin.' : 'Story updated successfully!');
    res.redirect(`/blogs/${blog._id}`);
  } catch (err) {
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    req.flash('error', 'Failed to update blog.');
    res.redirect(`/blogs/${blog._id}/edit`);
  }
};

// DELETE /blogs/:id
const deleteBlog = async (req, res) => {
  try {
    const byAdmin = isAdmin(req) && req.blog.author.toString() !== req.session.userId.toString();
    deleteImageFile(req.blog.coverImage);
    await Comment.deleteMany({ blog: req.blog._id });
    await req.blog.deleteOne();
    req.flash('success', byAdmin ? '🚨 Blog removed by NSS Admin for disciplinary reasons.' : 'Story deleted successfully.');
    res.redirect('/');
  } catch (err) {
    req.flash('error', 'Failed to delete blog.');
    res.redirect('/');
  }
};

// GET /admin — Admin dashboard
const getAdminDashboard = async (req, res) => {
  try {
    const User    = require('../models/User');
    const totalBlogs    = await Blog.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalUsers    = await User.countDocuments();

    const recentBlogs = await Blog.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 }).limit(20);

    const recentComments = await Comment.find()
      .populate('author', 'name email')
      .populate('blog', 'title')
      .sort({ createdAt: -1 }).limit(30);

    res.render('admin/dashboard', {
      title: 'Admin — NSS Dashboard',
      totalBlogs, totalComments, totalUsers,
      recentBlogs, recentComments,
    });
  } catch (err) {
    req.flash('error', 'Failed to load admin dashboard.');
    res.redirect('/');
  }
};

module.exports = {
  getAllBlogs, getMyBlogs,
  getCreateBlog, postCreateBlog,
  getBlog, getEditBlog, putUpdateBlog, deleteBlog,
  getAdminDashboard,
};
