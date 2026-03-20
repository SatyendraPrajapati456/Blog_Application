const express = require('express');
const router  = express.Router();

const {
  getRegister, postRegister,
  getLogin, postLogin,
  postLogout,
  getLoginHistory,
  getProfile, postProfile,
} = require('../controllers/authController');

const { requireGuest, requireAuth } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/upload');

router.get('/register',  requireGuest, getRegister);
router.post('/register', requireGuest, postRegister);

router.get('/login',     requireGuest, getLogin);
router.post('/login',    requireGuest, postLogin);

router.post('/logout', postLogout);

router.get('/login-history', requireAuth, getLoginHistory);
router.get('/profile',       requireAuth, getProfile);
// Avatar is optional — uploadAvatar.single() will simply skip if no file is sent
router.post('/profile',      requireAuth, uploadAvatar.single('avatar'), postProfile);

module.exports = router;
