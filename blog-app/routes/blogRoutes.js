const express = require('express');
const router  = express.Router();
const {
  getAllBlogs, getMyBlogs,
  getCreateBlog, postCreateBlog,
  getBlog, getEditBlog, putUpdateBlog, deleteBlog,
  getAdminDashboard,
} = require('../controllers/blogController');
const { requireAuth, requireBlogAuthor, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.get('/',    getAllBlogs);
router.get('/my',  requireAuth, getMyBlogs);
router.get('/admin-dashboard', requireAuth, requireAdmin, getAdminDashboard);

router.get('/',     getAllBlogs);
router.get('/new',  requireAuth, getCreateBlog);
router.post('/',    requireAuth, upload.single('coverImage'), postCreateBlog);

router.get('/:id',       getBlog);
router.get('/:id/edit',  requireAuth, requireBlogAuthor, getEditBlog);
router.put('/:id',       requireAuth, requireBlogAuthor, upload.single('coverImage'), putUpdateBlog);
router.delete('/:id',    requireAuth, requireBlogAuthor, deleteBlog);

module.exports = router;
