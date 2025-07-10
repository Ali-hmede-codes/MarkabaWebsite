# NewsMarkaba - موقع الأخبار

A modern, bilingual (Arabic/English) news website built with Next.js, Node.js, and PostgreSQL. Features a responsive design, PWA capabilities, and comprehensive content management.

## 🌟 Features

### Frontend Features
- **Bilingual Support**: Full Arabic and English language support with RTL layout
- **Responsive Design**: Mobile-first design that works on all devices
- **Progressive Web App (PWA)**: Offline support, installable, push notifications
- **Dark/Light Theme**: User-preferred theme with system detection
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, Structured Data
- **Performance Optimized**: Image optimization, lazy loading, code splitting
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

### Content Features
- **Article Management**: Create, edit, and publish news articles
- **Category System**: Organize content by categories
- **Search Functionality**: Full-text search with filters and sorting
- **User Authentication**: Registration, login, password recovery
- **Social Features**: Like articles, share content, user profiles
- **Comments System**: User engagement through comments
- **Newsletter**: Email subscription and management

### Technical Features
- **Modern Stack**: Next.js 13+, React 18, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with optimized queries
- **API**: RESTful API with Express.js
- **Caching**: Redis for session management and caching
- **File Upload**: Image upload with optimization
- **Security**: JWT authentication, input validation, CORS protection
- **Monitoring**: Error tracking and performance monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/newsmarkaba.git
   cd newsmarkaba
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb newsmarkaba
   
   # Run database migrations
   cd ../sql
   psql -d newsmarkaba -f create_tables.sql
   ```

4. **Environment Configuration**
   
   **Server (.env)**
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=newsmarkaba
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # CORS
   CLIENT_URL=http://localhost:3000
   
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # Email (for newsletters)
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_password
   
   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   ```
   
   **Client (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME=NewsMarkaba
   
   # Analytics (optional)
   NEXT_PUBLIC_GA_ID=your_google_analytics_id
   NEXT_PUBLIC_FB_PIXEL_ID=your_facebook_pixel_id
   ```

5. **Start the development servers**
   ```bash
   # Start the backend server
   cd server
   npm run dev
   
   # In another terminal, start the frontend
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
newsmarkaba/
├── client/                 # Next.js frontend
│   ├── components/         # React components
│   │   ├── Layout/        # Layout components
│   │   ├── Posts/         # Post-related components
│   │   ├── Categories/    # Category components
│   │   ├── Auth/          # Authentication components
│   │   └── UI/            # Reusable UI components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Next.js pages
│   ├── public/            # Static assets
│   ├── styles/            # CSS and styling
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── server/                # Express.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── uploads/           # File uploads
├── sql/                   # Database scripts
│   └── create_tables.sql  # Database schema
└── README.md
```

## 🔧 Development

### Available Scripts

**Client (Frontend)**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

**Server (Backend)**
```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Code Style

- **ESLint**: Configured for React, TypeScript, and Node.js
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Conventional Commits**: Commit message format

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request

## 🌐 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Refresh token
POST /api/auth/forgot       # Forgot password
POST /api/auth/reset        # Reset password
```

### Posts Endpoints

```
GET    /api/posts           # Get all posts
GET    /api/posts/:id       # Get post by ID
GET    /api/posts/slug/:slug # Get post by slug
POST   /api/posts           # Create new post (auth required)
PUT    /api/posts/:id       # Update post (auth required)
DELETE /api/posts/:id       # Delete post (auth required)
POST   /api/posts/:id/like  # Like/unlike post
```

### Categories Endpoints

```
GET    /api/categories      # Get all categories
GET    /api/categories/:id  # Get category by ID
POST   /api/categories      # Create category (auth required)
PUT    /api/categories/:id  # Update category (auth required)
DELETE /api/categories/:id  # Delete category (auth required)
```

### Search Endpoints

```
GET /api/search             # Search posts and categories
GET /api/search/posts       # Search posts only
GET /api/search/categories  # Search categories only
```

## 🎨 Theming and Customization

### Theme Configuration

The application supports light/dark themes with customizable colors:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // Add your custom colors
      }
    }
  }
}
```

### Language Support

Add new languages by:

1. Creating translation files in `client/locales/`
2. Updating the `ThemeContext` to include the new language
3. Adding RTL support if needed

## 📱 PWA Features

### Service Worker

- **Caching Strategy**: Network-first for API, cache-first for static assets
- **Offline Support**: Cached pages available offline
- **Background Sync**: Sync data when connection returns
- **Push Notifications**: Real-time notifications

### Installation

Users can install the app on their devices:
- **Desktop**: Chrome, Edge, Safari
- **Mobile**: Android (Chrome), iOS (Safari)

## 🔒 Security

### Authentication

- **JWT Tokens**: Secure authentication with refresh tokens
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Configured for specific origins

### Data Protection

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Content sanitization
- **HTTPS**: SSL/TLS encryption in production

## 🚀 Deployment

### Production Build

```bash
# Build client
cd client
npm run build

# Build server (if using TypeScript)
cd ../server
npm run build
```

### Environment Setup

1. **Database**: Set up PostgreSQL instance
2. **Redis**: Configure Redis for caching (optional)
3. **File Storage**: Configure file upload directory
4. **Environment Variables**: Set production environment variables
5. **SSL Certificate**: Configure HTTPS

### Deployment Options

- **Vercel**: Frontend deployment
- **Heroku**: Full-stack deployment
- **DigitalOcean**: VPS deployment
- **AWS**: Scalable cloud deployment
- **Docker**: Containerized deployment

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance

### Optimization Techniques

- **Image Optimization**: Next.js Image component with WebP
- **Code Splitting**: Dynamic imports and lazy loading
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Redis and browser caching
- **CDN**: Static asset delivery

### Monitoring

- **Core Web Vitals**: Performance metrics
- **Error Tracking**: Sentry integration
- **Analytics**: Google Analytics
- **Uptime Monitoring**: Health checks

## 🧪 Testing

### Frontend Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Backend Testing

```bash
# API tests
npm run test

# Integration tests
npm run test:integration
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** for new features
5. **Ensure all tests pass**
6. **Submit a pull request**

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add documentation for new features
- Ensure backward compatibility
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: contact@newsmarkaba.com

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection
psql -h localhost -U your_user -d newsmarkaba
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Build Errors**
```bash
# Clear cache
npm run clean
rm -rf node_modules
npm install
```

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Mobile App**: React Native mobile application
- [ ] **Admin Dashboard**: Content management interface
- [ ] **Advanced Analytics**: Detailed user and content analytics
- [ ] **Social Login**: OAuth integration (Google, Facebook, Twitter)
- [ ] **Video Support**: Video content management
- [ ] **Live Updates**: Real-time content updates
- [ ] **Multi-tenant**: Support for multiple news sites
- [ ] **AI Integration**: Content recommendations and auto-tagging

### Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: PWA support and offline functionality
- **v1.2.0**: Enhanced search and filtering
- **v1.3.0**: Performance optimizations

---

**Built with ❤️ by the NewsMarkaba Team**

For more information, visit our [website](https://newsmarkaba.com) or follow us on [Twitter](https://twitter.com/newsmarkaba).