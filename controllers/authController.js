const User         = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { deleteImage } = require('../config/cloudinary');

const getDeviceInfo = (ua = '') => {
  if (!ua) return 'Unknown Device';
  if (/mobile/i.test(ua)) {
    if (/android/i.test(ua)) return 'Android Mobile';
    if (/iphone/i.test(ua))  return 'iPhone';
    return 'Mobile Device';
  }
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  const browsers = [
    { name: 'Chrome',  re: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', re: /Firefox\/([\d.]+)/ },
    { name: 'Safari',  re: /Version\/([\d.]+).*Safari/ },
    { name: 'Edge',    re: /Edg\/([\d.]+)/ },
  ];
  for (const b of browsers) {
    const m = ua.match(b.re);
    if (m) {
      const os = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Desktop';
      return `${b.name} on ${os}`;
    }
  }
  return 'Desktop Browser';
};

const getIP = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress || 'Unknown';

// GET /auth/register
const getRegister = (req, res) => res.render('register', { title: 'Create Account' });

// POST /auth/register
const postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/auth/register');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/auth/register');
  }
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.redirect('/auth/register');
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/auth/register');
    }
    const user = await User.create({ name, email, password });
    req.session.userId = user._id;
    req.session.user   = { _id: user._id, name: user.name, email: user.email, avatar: user.avatar };
    await LoginHistory.create({ user: user._id, ipAddress: getIP(req), deviceInfo: getDeviceInfo(req.headers['user-agent']), status: 'success' });
    req.flash('success', `Welcome, ${user.name}! Your account has been created.`);
    res.redirect('/');
  } catch (err) {
    req.flash('error', err.name === 'ValidationError' ? Object.values(err.errors)[0].message : 'Registration failed.');
    res.redirect('/auth/register');
  }
};

// GET /auth/login
const getLogin = (req, res) => res.render('login', { title: 'Sign In' });

// POST /auth/login
const postLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Email and password are required.');
    return res.redirect('/auth/login');
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await LoginHistory.create({ user: user._id, ipAddress: getIP(req), deviceInfo: getDeviceInfo(req.headers['user-agent']), status: 'failed' });
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    // Check if account is banned
    if (user.banned) {
      req.flash('error', '🚫 Your account has been suspended. Please contact the NSS Admin.');
      return res.redirect('/auth/login');
    }
    req.session.userId = user._id;
    req.session.user   = { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role };
    // ✅ Save session explicitly to ensure cookie is set
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        req.flash('error', 'Session error. Please try again.');
        return res.redirect('/auth/login');
      }
      LoginHistory.create({ user: user._id, ipAddress: getIP(req), deviceInfo: getDeviceInfo(req.headers['user-agent']), status: 'success' }).catch(e => console.error('LoginHistory error:', e));
      req.flash('success', `Welcome back, ${user.name}!`);
      res.redirect('/');
    });
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/auth/login');
  }
};

// POST /auth/logout
const postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/auth/login');
  });
};

// GET /auth/login-history
const getLoginHistory = async (req, res) => {
  try {
    const records = await LoginHistory.find({ user: req.session.userId })
      .sort({ loginTime: -1 }).limit(50);
    res.render('profile/loginHistory', { title: 'Login History', records });
  } catch (err) {
    req.flash('error', 'Failed to load login history.');
    res.redirect('/');
  }
};

// GET /auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    const Blog         = require('../models/Blog');
    const Comment      = require('../models/Comment');
    const blogCount    = await Blog.countDocuments({ author: req.session.userId });
    const commentCount = await Comment.countDocuments({ author: req.session.userId });
    const lastLogin    = await LoginHistory.findOne({ user: req.session.userId, status: 'success' }).sort({ loginTime: -1 }).skip(1);
    res.render('profile/profile', { title: 'My Profile', user, blogCount, commentCount, lastLogin });
  } catch (err) {
    req.flash('error', 'Failed to load profile.');
    res.redirect('/');
  }
};

// POST /auth/profile  (handles both text fields AND optional avatar upload)
const postProfile = async (req, res) => {
  const { name, bio } = req.body;
  try {
    const user = await User.findById(req.session.userId);
    if (!user) { req.flash('error', 'User not found.'); return res.redirect('/auth/profile'); }

    if (name && name.trim().length >= 2) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim().substring(0, 300);

    // If a new avatar was uploaded via Cloudinary
    if (req.file) {
      const cloudinaryUrl = req.file.path || req.file.secure_url;
      if (cloudinaryUrl && cloudinaryUrl.startsWith('https://')) {
        // Delete old avatar from Cloudinary if it exists
        if (user.avatar) {
          await deleteImage(user.avatar);
        }
        user.avatar = cloudinaryUrl;
      } else {
        req.flash('error', 'Unable to upload image. Please try again.');
        return res.redirect('/auth/profile');
      }
    }

    await user.save();
    // Keep session in sync
    req.session.user.name   = user.name;
    req.session.user.avatar = user.avatar;

    req.flash('success', 'Profile updated!');
    res.redirect('/auth/profile');
  } catch (err) {
    if (req.file && req.file.path) {
      await deleteImage(req.file.path).catch(e => console.error('Cleanup error:', e));
    }
    console.error('Profile update error:', err);
    req.flash('error', err.message || 'Failed to update profile.');
    res.redirect('/auth/profile');
  }
};

module.exports = { getRegister, postRegister, getLogin, postLogin, postLogout, getLoginHistory, getProfile, postProfile };
