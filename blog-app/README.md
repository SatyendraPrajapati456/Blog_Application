# 📝 The Inkwell — Full-Stack Blogging App

A full-stack blogging platform built with Node.js, Express, MongoDB, and EJS with a clean editorial design.

## ✨ Features

- **Authentication** — Register, login, logout with bcrypt password hashing
- **Blog CRUD** — Create, read, update, delete blog posts
- **Comments** — Add and delete comments on blog posts
- **Authorization** — Only authors can edit/delete their own content
- **Session-based Auth** — Secure sessions with express-session
- **Pagination** — Homepage blog listing with page navigation
- **Flash Messages** — User feedback on all actions
- **Responsive UI** — Clean editorial design that works on all devices

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Views | EJS Templates |
| Auth | express-session + bcryptjs |
| Styling | Custom CSS (editorial design) |

---

## 📁 Project Structure

```
blog-app/
├── app.js                  # Entry point
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js   # Register / login / logout
│   ├── blogController.js   # Blog CRUD
│   └── commentController.js# Comment add/delete
├── middleware/
│   └── authMiddleware.js   # Auth guards + session helpers
├── models/
│   ├── User.js
│   ├── Blog.js
│   └── Comment.js
├── routes/
│   ├── authRoutes.js
│   ├── blogRoutes.js
│   └── commentRoutes.js
├── views/
│   ├── partials/
│   │   ├── head.ejs
│   │   ├── navbar.ejs
│   │   ├── footer.ejs
│   │   └── flash.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── createBlog.ejs
│   ├── blogDetail.ejs
│   ├── 404.ejs
│   └── error.ejs
├── public/                 # Static assets
├── .env                    # Environment variables
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher — [nodejs.org](https://nodejs.org)
- **MongoDB** (local or Atlas) — [mongodb.com](https://www.mongodb.com)

---

### 1. Clone / Download the project

```bash
cd blog-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Edit the `.env` file in the root:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blogapp
SESSION_SECRET=change_this_to_a_strong_random_secret
NODE_ENV=development
```

**For MongoDB Atlas** (cloud), replace `MONGODB_URI` with your Atlas connection string:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/blogapp
```

### 4. Start MongoDB (if running locally)

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. Run the app

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

### 6. Open in browser

```
http://localhost:3000
```

---

## 🔒 Auth Flow

1. Visit `/auth/register` → Create an account
2. Visit `/auth/login` → Sign in
3. Session is stored server-side with a 7-day expiry
4. Visit any protected route while unauthenticated → Redirected to `/auth/login`

---

## 📋 API Routes

### Auth
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | `/auth/register` | Register page | Guest only |
| POST | `/auth/register` | Create account | Guest only |
| GET | `/auth/login` | Login page | Guest only |
| POST | `/auth/login` | Sign in | Guest only |
| POST | `/auth/logout` | Sign out | — |

### Blogs
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| GET | `/blogs` | All blogs (homepage) | No |
| GET | `/blogs/new` | Create form | Yes |
| POST | `/blogs` | Create blog | Yes |
| GET | `/blogs/:id` | Blog detail | No |
| GET | `/blogs/:id/edit` | Edit form | Author only |
| PUT | `/blogs/:id` | Update blog | Author only |
| DELETE | `/blogs/:id` | Delete blog | Author only |

### Comments
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | `/blogs/:id/comments` | Add comment | Yes |
| DELETE | `/blogs/:id/comments/:commentId` | Delete comment | Author only |

---

## 🗄 Database Schemas

### User
```js
{ name, email, password (hashed), role, createdAt, updatedAt }
```

### Blog
```js
{ title, content, excerpt (auto-generated), author (ref: User), createdAt, updatedAt }
```

### Comment
```js
{ text, author (ref: User), blog (ref: Blog), createdAt, updatedAt }
```

---

## 🔐 Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- Session secret from environment variable
- Authorization middleware on all protected routes
- Server-side form validation on all inputs
- HTML form method override for PUT/DELETE

---

## 🧩 Troubleshooting

**MongoDB connection error**
- Make sure MongoDB is running locally, or check your Atlas connection string
- Verify the `MONGODB_URI` in `.env`

**Sessions not persisting**
- Ensure `SESSION_SECRET` is set in `.env`
- Check that cookies are enabled in your browser

**Port already in use**
- Change `PORT=3000` to another port in `.env`
