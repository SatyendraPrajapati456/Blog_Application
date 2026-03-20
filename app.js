require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

const connectDB = require('./config/db');
const { attachUser } = require('./middleware/authMiddleware');

const authRoutes    = require('./routes/authRoutes');
const blogRoutes    = require('./routes/blogRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes    = require('./routes/likeRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ CRITICAL for production: Trust reverse proxy (Render, Heroku, etc.)
// This allows Express to read X-Forwarded-Proto header to know if original request was HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override (for PUT/DELETE from forms)
app.use(methodOverride('_method'));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,                              // ✅ Prevents XSS attacks
      sameSite: 'lax',                             // ✅ CSRF protection
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in production
      maxAge: 1000 * 60 * 60 * 24 * 7,            // 7 days
    },
  })
);

// Flash messages
app.use(flash());

// Attach user to every request/view
app.use(attachUser);

// Inject active announcement into every view
app.use(async (req, res, next) => {
  try {
    const Announcement = require('./models/Announcement');
    const ann = await Announcement.findOne({ active: true }).sort({ createdAt: -1 });
    res.locals.announcement = ann || null;
  } catch (e) {
    res.locals.announcement = null;
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/blogs', blogRoutes);
app.use('/blogs/:id/comments', commentRoutes);
app.use('/blogs/:id/like',     likeRoutes);

// Root redirect
app.get('/', (req, res) => res.redirect('/blogs'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Server Error', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const { credsMissing } = require('./config/cloudinary');
  console.log(`\n🚀 NSS Blog running at \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  if (credsMissing) {
    console.log('\x1b[33m⚠  CLOUDINARY NOT CONFIGURED — image uploads will fail.\x1b[0m');
    console.log('\x1b[33m   Add CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET to .env\x1b[0m');
  } else {
    console.log('\x1b[32m✓  Cloudinary image storage ready\x1b[0m');
  }
  console.log('');
});

module.exports = app;
