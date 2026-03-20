# NSS Blog — Rungta College of Engineering & Technology

A full-stack blogging platform for the **National Service Scheme (NSS)** unit at Rungta College, Bhilai. Built with Node.js, Express, MongoDB, and EJS. All images (blog covers + user avatars) are stored on **Cloudinary**.

---

## 🚀 Quick Start

### 1 — Prerequisites
| Tool | Version |
|------|---------|
| Node.js | 16 + |
| MongoDB | Local or [Atlas](https://mongodb.com/atlas) |
| Cloudinary account | [cloudinary.com](https://cloudinary.com) (free tier is enough) |

### 2 — Install dependencies
```bash
unzip blog-app.zip
cd blog-app
npm install
```

### 3 — Configure environment variables
Open `.env` and fill in **all five** values:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nss-blog
SESSION_SECRET=change_this_to_a_long_random_string

# ── Cloudinary ─────────────────────────────────────────────────
# Get these from https://cloudinary.com/console  (Dashboard page)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### How to get Cloudinary credentials
1. Sign up free at https://cloudinary.com
2. Go to **Dashboard** → copy **Cloud name**, **API Key**, **API Secret**
3. Paste them into `.env`

### 4 — Run
```bash
npm run dev    # development (nodemon, auto-restart)
npm start      # production
```
Visit → http://localhost:3000

---

## 🖼️ Cloudinary Image Storage

All images are uploaded directly to Cloudinary — **nothing is saved to disk**.

| Image type | Cloudinary folder | Auto-transform |
|-----------|-------------------|----------------|
| Blog cover | `nss-blog/covers/` | 1200×630, quality auto |
| User avatar | `nss-blog/avatars/` | 300×300, face-crop |

- When a blog is deleted, its cover is **automatically removed** from Cloudinary.
- When a user uploads a new avatar, the old one is **automatically removed**.
- Cover images are served via Cloudinary's global CDN — fast worldwide.

---

## 🛡️ Admin Account

Log in with **sp5267062@gmail.com** to get full disciplinary admin access:

- Edit or remove **any** blog on the platform
- Remove **any** comment
- View the **Admin Dashboard** (`/blogs/admin-dashboard`) with:
  - Site-wide stats (blogs, comments, users, likes)
  - Full blogs table with edit/remove
  - Full comments table with remove
  - User management (ban / reinstate accounts)
  - Site-wide announcement banner (info / warning / success)

---

## 📁 Project Structure

```
blog-app/
├── app.js                   — Express entry point
├── .env                     — Environment variables (fill in Cloudinary keys!)
├── config/
│   ├── db.js                — MongoDB connection
│   └── cloudinary.js        — Cloudinary + multer config (covers & avatars)
├── middleware/
│   ├── authMiddleware.js    — Auth, admin guard, user attach
│   └── upload.js            — Re-exports uploadCover & uploadAvatar
├── models/
│   ├── User.js
│   ├── Blog.js
│   ├── Comment.js
│   ├── Like.js
│   ├── Announcement.js
│   └── LoginHistory.js
├── controllers/
│   ├── authController.js
│   ├── blogController.js
│   └── commentController.js
├── routes/
│   ├── authRoutes.js
│   ├── blogRoutes.js
│   ├── commentRoutes.js
│   └── likeRoutes.js
├── views/
│   ├── partials/            — head, navbar, footer, flash, sidebar
│   ├── admin/dashboard.ejs  — Admin control panel
│   ├── profile/             — profile, myBlogs, loginHistory
│   ├── index.ejs            — Homepage with filters
│   ├── blogDetail.ejs       — Single blog + comments + likes
│   ├── createBlog.ejs       — Create / edit blog
│   ├── login.ejs
│   └── register.ejs
└── public/
    └── images/              — Static NSS institutional logos (local)
```

---

## ✨ Features

- ✅ Register / Login / Logout (bcrypt + sessions)
- ✅ Blog CRUD with Cloudinary cover image upload
- ✅ User profile with Cloudinary avatar upload
- ✅ Category + time + search filtering
- ✅ Pagination (6 per page)
- ✅ Comments
- ✅ Likes (toggle, AJAX, no reload)
- ✅ Login history tracking (IP + device)
- ✅ NSS institutional branding (CSVTU, Rungta, NSS, My Bharat, MoYAS logos)
- ✅ Admin dashboard (sp5267062@gmail.com)
  - Edit / delete any blog or comment
  - Ban / reinstate users
  - Site-wide announcement banner
