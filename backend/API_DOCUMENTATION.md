text
# Google Calendar Clone - API Documentation

## Base URL
http://localhost:5000/api

text

## Event Endpoints

### Get All Events
**GET** `/events`

Query Parameters:
- `start` (optional): Start date (ISO 8601 format)
- `end` (optional): End date (ISO 8601 format)

Response:
{
"success": true,
"count": 5,
"data": [...]
}

text

### Get Single Event
**GET** `/events/:id`

### Create Event
**POST** `/events`

Body:
{
"title": "Team Meeting",
"description": "Weekly sync",
"start_time": "2025-11-05T10:00:00Z",
"end_time": "2025-11-05T11:00:00Z",
"location": "Conference Room A",
"color": "#1967d2",
"is_all_day": false,
"recurrence_rule": "FREQ=WEEKLY;INTERVAL=1;COUNT=10",
"timezone": "UTC",
"reminder_minutes": 30
}

text

### Update Event
**PUT** `/events/:id`

### Delete Event
**DELETE** `/events/:id`

### Check Conflicts
**GET** `/events/conflicts?start_time=2025-11-05T10:00:00Z&end_time=2025-11-05T11:00:00Z`

### Bulk Delete
**POST** `/events/bulk-delete`

Body:
{
"event_ids":​
}

text

## AI Endpoints

### Get Smart Suggestions
**GET** `/ai/suggestions`

### Suggest Optimal Time
**GET** `/ai/suggest-time?duration=60`

### Analyze Patterns
**GET** `/ai/analyze-patterns`

### Recommend Time Slots
**GET** `/ai/recommend-slots?date=2025-11-05&duration=60&count=3`

### Suggest Event Title
**GET** `/ai/suggest-title?context=meeting`

### Get Conflicts
**GET** `/ai/conflicts`

## Recurrence Rules Format

Format: `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY;INTERVAL=n;COUNT=n`

Examples:
- Daily: `FREQ=DAILY;INTERVAL=1;COUNT=10`
- Weekly: `FREQ=WEEKLY;INTERVAL=1;COUNT=52`
- Monthly: `FREQ=MONTHLY;INTERVAL=1;COUNT=12`
Step 12: Run Commands
Create a quick start script:

File: backend/package.json (update scripts section):

json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "echo \"No tests yet\" && exit 0"
  }
}
Final Setup Commands:
bash
# Navigate to backend directory
cd backend

# Install dependencies (if not done already)
npm install

# Create database directory
mkdir -p src/database

# Run in development mode
npm run dev

# Or run in production mode
npm start
Testing the Backend:
bash
# Test health endpoint
curl http://localhost:5000/health

# Create a test event
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "start_time": "2025-11-05T10:00:00Z",
    "end_time": "2025-11-05T11:00:00Z"
  }'

# Get all events
curl http://localhost:5000/api/events

# Get AI suggestions
curl http://localhost:5000/api/ai/suggestions