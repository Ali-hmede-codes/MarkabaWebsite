# 📰 Custom News Website - AI Developer README

## 📌 Project Goal
Create a professional, scalable, and SEO-friendly news website similar to [bintjbeil.org](https://bintjbeil.org) using modern web technologies. The site will support Arabic and English, include an admin panel, and support news publishing with media.

---

## 🧰 Tech Stack Overview

### 🔹 Frontend (High Performance)
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: **Next.js** (React-based, SEO-friendly, server-side rendering, super fast)
- **Styling**: Tailwind CSS (utility-first, modern styling framework)
- **Data Fetching**: SWR or Axios

### 🔹 Backend (Modular and Scalable)
- **Platform**: Node.js with Express.js
- **Architecture**: Fully modular with separate endpoints per feature for easy expansion and maintenance
- **Database**: **MySQL** using **phpMyAdmin**
- **ORM/Query Builder**: Knex.js or Sequelize (optional)

### 🔹 Admin Panel
- Custom built with Next.js + Tailwind CSS (dashboard UI)
- Authentication: JWT + bcrypt
- Features:
  - Create/Edit/Delete news
  - Manage media
  - Post "خبر عاجل" alerts
  - View dashboard stats (views, shares)

### 🔹 Hosting
- **Frontend + Backend**: Deployed on **Hostinger VPS**
- **Storage**: Use VPS filesystem for news images/videos (with a folder structure like `/public/uploads`)

### 🔹 Optional Integrations
- OneSignal (for push notifications)
- Google Analytics (site tracking)

---

## 🌐 Website Features

### User Side
- Ultra-fast Next.js rendering
- Responsive design (mobile-first)
- SEO meta tags and dynamic sitemap
- Multi-language (Arabic/English switch + RTL support)
- "خبر عاجل" red banner for breaking news
- Category browsing and search filtering
- Social sharing tools

### Admin Side
- Secure login/authentication (JWT)
- Add/Edit/Delete articles with media upload
- Add/Remove a "خبر عاجل" (Breaking News) that shows on the homepage as a red rectangle bar
- Dashboard with stats (articles/views/visits)
- User-friendly editor (e.g., Quill.js or TipTap)

---

## 📂 Project Structure
```
/news-site
├── client/              # Frontend (Next.js)
│   ├── components/
│   ├── pages/
│   │   ├── index.js
│   │   ├── post/[id].js
│   │   ├── category/[slug].js
│   │   └── admin/
│   ├── public/
│   └── styles/
├── server/              # Backend (Node.js + Express)
│   ├── controllers/     # Logic per endpoint
│   ├── models/          # MySQL queries or ORM files
│   ├── routes/          # Each route split by feature (post, auth, user, category, breakingNews)
│   ├── middlewares/
│   └── index.js         # App entrypoint
├── uploads/             # Media stored locally on VPS
├── sql/                 # Folder containing .sql scripts for database
├── .env
├── README.md
└── package.json
```

---

## 🗃️ SQL Database Setup (MySQL with phpMyAdmin)
Place these `.sql` files in the `/sql/` folder.

### `create_tables.sql`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image VARCHAR(255),
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE breaking_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Environment Variables (`.env`)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=news_site
PORT=5000
JWT_SECRET=your_super_secret
UPLOAD_PATH=uploads/
```

---

## 🧠 AI Assistant Instructions

### ✅ Create Breaking News Feature
"Build a Breaking News alert feature. Use a red rectangle with Arabic text ('خبر عاجل') if a breaking news item is active in the `breaking_news` table. Allow admin to add/edit/delete it."

### ✅ Connect MySQL to Backend
"Use mysql2 package to connect Node.js to phpMyAdmin. Create a file `db.js` to export a database connection."

---

## 🚀 Deployment Plan

### VPS (Hostinger)
1. Install Node.js, NGINX, MySQL, phpMyAdmin
2. Use PM2 for backend process management
3. Reverse proxy with NGINX
4. Set up database using phpMyAdmin with `create_tables.sql`

Suggested VPS folder:
```
/var/www/news-site
├── client/ (Next.js build)
├── server/ (Express API)
├── uploads/ (Media)
├── sql/ (SQL scripts)
```

---

## ✅ Future Features
- Commenting system (with email notifications)
- Bookmarking for users
- Ads and sponsor banners
- Video streaming
- Newsletter signup

---

## 📞 Support
Use this README with your AI assistant to generate backend routes, frontend components, and SQL queries with full awareness of the system structure.

---

## 📣 License
Open-source for educational and non-commercial use. For commercial projects, attribution is appreciated.

---

## ✨ Example Command to Start
"Create an API route in `routes/breakingNews.js` that fetches the latest active 'خبر عاجل'. Display it on the homepage using a red bar if available."

---

Let’s build a high-speed, modern, powerful news platform — your way.

