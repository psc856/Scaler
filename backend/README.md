# Google Calendar Clone - Backend API

A production-ready Google Calendar clone backend with AI-powered features, built with Node.js and Express.

## 🚀 Features

### Core Calendar Features
- ✅ **Event CRUD Operations** - Create, read, update, delete events
- ✅ **Recurring Events** - Support for daily, weekly, monthly patterns
- ✅ **Conflict Detection** - Automatic overlap detection and warnings
- ✅ **Time Zone Support** - Multi-timezone event handling
- ✅ **All-day Events** - Support for full-day events

### AI-Powered Features
- 🤖 **Smart Title Suggestions** - AI generates relevant event titles
- 🎯 **Optimal Time Finding** - AI finds best meeting slots
- 📊 **Smart Insights** - Calendar analytics and recommendations
- 🔍 **Pattern Recognition** - Learn from user scheduling habits

### Advanced Features
- 📧 **Email Notifications** - Event confirmations and reminders
- 📈 **Analytics Dashboard** - Productivity insights and metrics
- 🔔 **Smart Reminders** - Customizable notification system
- 📊 **Daily/Weekly Digests** - Automated calendar summaries
- 🛡️ **Security Features** - Rate limiting, input sanitization, XSS protection
- ⚡ **Performance Optimization** - Caching and efficient queries

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: JSON-based (SQLite alternative)
- **AI Integration**: OpenAI GPT / Groq Llama
- **Email**: Nodemailer with Gmail
- **Security**: Helmet, Rate Limiting, Input Validation
- **Caching**: In-memory cache service

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## ⚙️ Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000

# Gmail Configuration (Optional)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# AI Configuration (Optional - Choose one)
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
HUGGINGFACE_API_KEY=your-hf-api-key

# Database
DATABASE_PATH=./src/database/calendar.json
```

## 🔧 API Endpoints

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get specific event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/conflicts` - Check for conflicts

### AI Features
- `POST /api/ai/suggest-title` - Get AI title suggestions
- `POST /api/ai/optimal-time` - Find optimal meeting time
- `GET /api/ai/insights` - Get calendar insights

### Analytics
- `GET /api/analytics/calendar` - Calendar analytics
- `GET /api/analytics/engagement` - User engagement metrics
- `GET /api/analytics/productivity` - Productivity insights

### Authentication
- `POST /api/auth/connect-gmail` - Connect Gmail account
- `POST /api/auth/disconnect-gmail` - Disconnect Gmail
- `GET /api/auth/status` - Check connection status

## 🤖 AI Integration Setup

### Option 1: Groq (Recommended - Free)
1. Sign up at [Groq Console](https://console.groq.com)
2. Get your API key
3. Set `GROQ_API_KEY` in `.env`

### Option 2: OpenAI
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Get your API key
3. Set `OPENAI_API_KEY` in `.env`

### Option 3: Hugging Face
1. Sign up at [Hugging Face](https://huggingface.co)
2. Get your API token
3. Set `HUGGINGFACE_API_KEY` in `.env`

## 📧 Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update Environment Variables**:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=generated-app-password
   ```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Sanitization**: XSS protection on all inputs
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: Standard security headers
- **Input Validation**: Schema validation for all endpoints

## 📊 Performance Features

- **Caching**: In-memory cache for frequent queries
- **Optimized Queries**: Efficient data filtering
- **Batch Operations**: Bulk event operations
- **Connection Pooling**: Optimized database connections

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific endpoint
curl -X GET http://localhost:5001/api/health
```

## 📈 Monitoring

### Health Check
```bash
GET /health
```

Response includes status of all services:
- Database connection
- Email configuration
- AI service availability
- Cache status
- Notification system

### Analytics
Access comprehensive analytics at:
- `/api/analytics/calendar` - Usage patterns
- `/api/analytics/productivity` - Efficiency metrics
- `/api/analytics/engagement` - User activity

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [API Documentation](API_DOCUMENTATION.md)
- Review the troubleshooting guide

## 🔄 Changelog

### v2.0.0 (Latest)
- ✅ Added AI-powered features
- ✅ Enhanced security measures
- ✅ Performance optimizations
- ✅ Analytics dashboard
- ✅ Smart notifications
- ✅ Caching system

### v1.0.0
- ✅ Basic CRUD operations
- ✅ Event management
- ✅ Email notifications