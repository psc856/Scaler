# Google Calendar Clone with AI Features

A production-ready Google Calendar clone with AI-powered features, Gmail integration, and intelligent event management.

## 🚀 Features

### Core Calendar Features
- ✅ **Complete CRUD Operations** - Create, read, update, delete events
- ✅ **Recurring Events** - Daily, weekly, monthly patterns
- ✅ **Conflict Detection** - Automatic overlap detection and warnings
- ✅ **Multi-timezone Support** - Global scheduling capabilities
- ✅ **All-day Events** - Full-day event support
- ✅ **Advanced Search** - Find events quickly

### AI-Powered Features
- 🤖 **Smart Title Suggestions** - AI generates relevant event titles
- 🎯 **Optimal Time Finding** - AI finds best meeting slots
- 📊 **Calendar Insights** - Analytics and productivity recommendations
- 🔍 **Pattern Recognition** - Learns from scheduling habits

### Gmail Integration
- 📧 **OAuth Authentication** - Secure Gmail connection
- 🔔 **Email Notifications** - Event confirmations and reminders
- 📨 **Automated Reminders** - Customizable notification system
- 📊 **Daily/Weekly Digests** - Calendar summaries via email

### Advanced Features
- 🛡️ **Security** - Rate limiting, input sanitization, XSS protection
- ⚡ **Performance** - Caching, optimized queries, fast UI
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Clean, intuitive interface

## 🛠️ Tech Stack

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **Gmail API** - Email integration
- **OpenAI/Groq** - AI features
- **JSON Database** - Lightweight storage

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **SCSS** - Styling
- **React Big Calendar** - Calendar component
- **Axios** - HTTP client

## 📦 Quick Start

### Prerequisites
- Node.js 18+ installed
- Gmail account for email features
- AI API key (Groq/OpenAI) for AI features

### 1. Clone & Install
```bash
git clone <repository-url>
cd Assignment
```

### 2. Easy Setup (Windows)
```bash
# Run the automated setup script
start.bat
```

### 3. Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5002
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Google OAuth (for Gmail integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5002/api/auth/gmail/callback

# AI Configuration (Choose one)
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_PATH=./src/database/calendar.json
```

### Frontend Environment Variables (.env)
```env
VITE_API_BASE_URL=http://localhost:5002/api
VITE_APP_NAME=Google Calendar Clone
VITE_FRONTEND_URL=http://localhost:3000
```

## 🔧 Gmail Integration Setup

### 1. Enable Gmail API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5002/api/auth/gmail/callback`

### 2. Get App Password
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings → Security
3. Generate App Password for "Mail"
4. Use this password in `GMAIL_APP_PASSWORD`

### 3. Connect Gmail in App
1. Open Settings in the app
2. Enter your Gmail address
3. Click "Connect Gmail"
4. Authorize the application

## 🤖 AI Features Setup

### Option 1: Groq (Recommended - Free)
1. Sign up at [Groq Console](https://console.groq.com)
2. Get your API key
3. Set `GROQ_API_KEY` in backend .env

### Option 2: OpenAI
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Get your API key
3. Set `OPENAI_API_KEY` in backend .env

## 📚 API Documentation

### Events API
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/conflicts` - Check conflicts

### AI API
- `GET /api/ai/suggest-title?context=meeting` - Get title suggestions
- `GET /api/ai/suggest-time?duration=60` - Find optimal time
- `GET /api/ai/insights` - Get calendar insights

### Gmail API
- `GET /api/auth/gmail/auth-url` - Get OAuth URL
- `GET /api/auth/gmail/status` - Check connection
- `POST /api/auth/gmail/disconnect` - Disconnect Gmail

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up --build
```

## 🔒 Security Features

- **Rate Limiting** - 100 requests per 15 minutes
- **Input Sanitization** - XSS protection
- **CORS Protection** - Controlled origins
- **Helmet Security** - Standard headers
- **OAuth 2.0** - Secure Gmail integration

## 📊 Performance Features

- **Caching** - In-memory cache for frequent queries
- **Optimized Queries** - Efficient data filtering
- **Code Splitting** - Lazy loading components
- **Asset Optimization** - Minified builds

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Health check
curl http://localhost:5002/health
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Port conflicts:**
- Change PORT in backend .env
- Update VITE_API_BASE_URL in frontend .env

**Gmail not working:**
- Check app password is correct
- Verify 2FA is enabled
- Check OAuth credentials

**AI features not working:**
- Verify API key is correct
- Check API quota/billing
- Fallback algorithms will work without AI

### Support

For issues and questions:
- Check the troubleshooting guide
- Review API documentation
- Create GitHub issue

## 🔄 Changelog

### v2.0.0 (Latest)
- ✅ Gmail OAuth integration
- ✅ Enhanced AI features
- ✅ Improved security
- ✅ Performance optimizations
- ✅ Better error handling

### v1.0.0
- ✅ Basic calendar functionality
- ✅ Event CRUD operations
- ✅ Email notifications