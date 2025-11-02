# Complete Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Run the Setup Script
```bash
# Windows users - double click or run:
start.bat

# This will automatically:
# - Install all dependencies
# - Start both servers
# - Open the application
```

### Step 2: Configure Gmail (Optional but Recommended)
1. Open the app at http://localhost:3000
2. Click Settings (gear icon)
3. Enter your Gmail address
4. Click "Connect Gmail"
5. Authorize the application

### Step 3: Test AI Features
1. Create a new event
2. Type "team" in the title field
3. Click the sparkle icon for AI suggestions
4. Click "Suggest optimal time" for AI scheduling

## 📧 Gmail Integration Setup

### Method 1: Using App Password (Recommended)
1. **Enable 2-Factor Authentication**
   - Go to myaccount.google.com
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Copy the 16-character password

3. **Update Backend Configuration**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

### Method 2: OAuth 2.0 (Advanced)
1. **Google Cloud Console Setup**
   - Go to console.cloud.google.com
   - Create new project: "Calendar Clone"
   - Enable Gmail API

2. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5002/api/auth/gmail/callback`

3. **Update Environment Variables**
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## 🤖 AI Features Setup

### Option 1: Groq (Free & Fast)
1. Visit console.groq.com
2. Sign up with Google/GitHub
3. Create API key
4. Add to backend .env:
   ```env
   GROQ_API_KEY=gsk_your-groq-api-key
   ```

### Option 2: OpenAI (Paid but Powerful)
1. Visit platform.openai.com
2. Create account and add billing
3. Generate API key
4. Add to backend .env:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

## 🔧 Manual Installation

### Prerequisites
- Node.js 18+ (download from nodejs.org)
- Git (optional, for cloning)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing the Integration

### 1. Basic Functionality Test
- ✅ Create an event
- ✅ Edit an event
- ✅ Delete an event
- ✅ Check calendar views (month, week, day)

### 2. Gmail Integration Test
- ✅ Connect Gmail in settings
- ✅ Create event with reminder
- ✅ Check email for confirmation
- ✅ Verify reminder email arrives

### 3. AI Features Test
- ✅ Type "team meeting" → Click AI suggestions
- ✅ Click "Suggest optimal time"
- ✅ Check AI insights in analytics

### 4. Conflict Detection Test
- ✅ Create overlapping events
- ✅ Verify conflict warning appears
- ✅ Check conflict resolution suggestions

## 🚨 Troubleshooting

### Port Issues
**Problem:** Port 3000 or 5002 already in use
**Solution:**
```bash
# Kill processes using ports
netstat -ano | findstr :3000
taskkill /PID <process-id> /F

# Or change ports in .env files
```

### Gmail Connection Issues
**Problem:** Gmail authentication fails
**Solutions:**
1. Verify 2FA is enabled
2. Generate new app password
3. Check email/password in .env
4. Ensure no spaces in credentials

### AI Features Not Working
**Problem:** AI suggestions return errors
**Solutions:**
1. Verify API key is correct
2. Check API quota/billing
3. Try different AI provider
4. Fallback algorithms will still work

### Database Issues
**Problem:** Events not saving
**Solutions:**
1. Check database directory exists
2. Verify write permissions
3. Check backend logs for errors

## 📊 Performance Optimization

### Backend Optimizations
- Enable caching for frequent queries
- Use compression middleware
- Optimize database queries
- Implement connection pooling

### Frontend Optimizations
- Enable React.memo for components
- Use useCallback for event handlers
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

## 🔒 Security Best Practices

### Environment Variables
- Never commit .env files
- Use different keys for production
- Rotate API keys regularly
- Use strong passwords

### API Security
- Enable rate limiting
- Validate all inputs
- Sanitize user data
- Use HTTPS in production

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=80
CORS_ORIGIN=https://your-domain.com
```

### Build Commands
```bash
# Frontend production build
cd frontend
npm run build

# Backend production start
cd backend
npm start
```

### Docker Deployment
```dockerfile
# Use provided Dockerfile
docker build -t calendar-clone .
docker run -p 80:80 calendar-clone
```

## 📈 Monitoring & Analytics

### Health Checks
- Backend: http://localhost:5002/health
- Frontend: Check console for errors
- Database: Verify JSON files exist

### Performance Monitoring
- Monitor API response times
- Track memory usage
- Check error rates
- Monitor user engagement

## 🤝 Getting Help

### Documentation
- API docs: /api/docs (when available)
- Component docs: Storybook (when available)
- Database schema: /docs/database.md

### Support Channels
- GitHub Issues: For bugs and features
- Discussions: For questions and help
- Wiki: For detailed guides

### Common Commands
```bash
# Restart servers
npm run dev

# Clear cache
npm run clean

# Run tests
npm test

# Check logs
npm run logs

# Update dependencies
npm update
```

## ✅ Success Checklist

After setup, you should have:
- [ ] Backend running on port 5002
- [ ] Frontend running on port 3000
- [ ] Gmail connected and sending emails
- [ ] AI features working (title suggestions, optimal time)
- [ ] Events creating, editing, deleting successfully
- [ ] Conflict detection working
- [ ] Responsive design on mobile/desktop
- [ ] No console errors
- [ ] Email notifications arriving
- [ ] Calendar insights showing data

## 🎉 You're Ready!

Your Google Calendar clone is now fully integrated and ready to use! Enjoy the AI-powered scheduling and Gmail integration features.