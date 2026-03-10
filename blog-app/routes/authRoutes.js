const express = require('express');
const router = express.Router();
const {
  getRegister, postRegister,
  getLogin, postLogin,
  postLogout,
  getLoginHistory,
  getProfile, postProfile,
} = require('../controllers/authController');
const { requireGuest, requireAuth } = require('../middleware/authMiddleware');

router.get('/register', requireGuest, getRegister);
router.post('/register', requireGuest, postRegister);

router.get('/login', requireGuest, getLogin);
router.post('/login', requireGuest, postLogin);

router.post('/logout', postLogout);

router.get('/login-history', requireAuth, getLoginHistory);
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, postProfile);

module.exports = router;
