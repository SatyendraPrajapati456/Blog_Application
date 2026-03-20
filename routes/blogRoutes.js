const express = require('express');
const router  = express.Router();

const {
  getAllBlogs, getMyBlogs,
  getCreateBlog, postCreateBlog,
  getBlog, getEditBlog, putUpdateBlog, deleteBlog,
  getAdminDashboard, postAnnouncement, toggleBanUser,
} = require('../controllers/blogController');

const { requireAuth, requireBlogAuthor, requireAdmin } = require('../middleware/authMiddleware');
const { uploadCover } = require('../middleware/upload');

// ── Public / filtered listing ─────────────────────────────────────────────────
router.get('/',    getAllBlogs);
router.get('/my',  requireAuth, getMyBlogs);

// ── Admin dashboard & actions ─────────────────────────────────────────────────
router.get('/admin-dashboard',            requireAuth, requireAdmin, getAdminDashboard);
router.post('/admin/announcement',        requireAuth, requireAdmin, postAnnouncement);
router.post('/admin/ban/:userId',         requireAuth, requireAdmin, toggleBanUser);

// ── Create blog ───────────────────────────────────────────────────────────────
router.get('/new',  requireAuth, getCreateBlog);
router.post('/',    requireAuth, uploadCover.single('coverImage'), postCreateBlog);

// ── Single blog CRUD ──────────────────────────────────────────────────────────
router.get('/:id',       getBlog);
router.get('/:id/edit',  requireAuth, requireBlogAuthor, getEditBlog);
router.put('/:id',       requireAuth, requireBlogAuthor, uploadCover.single('coverImage'), putUpdateBlog);
router.delete('/:id',    requireAuth, requireBlogAuthor, deleteBlog);

module.exports = router;
