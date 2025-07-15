# Exercise App Backend

A Node.js/Express backend for a voice-powered exercise tracking application. This backend processes natural language voice commands to log exercises and provides APIs for managing workout data.

## 🚀 Features

- **Voice Command Processing**: Uses OpenAI to parse natural language exercise commands
- **Exercise Logging**: Automatically extracts and logs exercise data
- **RESTful APIs**: Complete CRUD operations for exercises and workout history
- **Input Validation**: Comprehensive validation using Joi
- **Security**: Rate limiting, CORS, and security headers
- **Error Handling**: Robust error handling and logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd exerciseapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Voice Processing

#### Process Voice Command
```http
POST /api/voice/process
```

**Request Body:**
```json
{
  "voiceCommand": "I did 15 push-ups",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "exercise": {
      "exercise": "push-ups",
      "reps": 15,
      "sets": 1,
      "weight": null,
      "duration": null,
      "muscleGroups": ["chest", "triceps", "shoulders"],
      "confidence": 0.95,
      "userId": "user123",
      "date": "2024-01-15T10:30:00.000Z",
      "originalCommand": "I did 15 push-ups",
      "processedAt": "2024-01-15T10:30:00.000Z"
    },
    "message": "Successfully logged: push-ups"
  },
  "message": "Voice command processed successfully"
}
```

#### Get Example Commands
```http
GET /api/voice/examples
```

#### Get Service Status
```http
GET /api/voice/status
```

### Exercise Management

#### Get All Exercises
```http
GET /api/exercises?userId=user123
```

#### Get Exercise History
```http
GET /api/exercises/history?userId=user123&limit=10
```

#### Create Exercise
```http
POST /api/exercises
```

**Request Body:**
```json
{
  "userId": "user123",
  "exercise": "squats",
  "reps": 12,
  "sets": 3,
  "weight": 135,
  "duration": null,
  "muscleGroups": ["quadriceps", "glutes", "hamstrings"]
}
```

#### Get Exercise Statistics
```http
GET /api/exercises/stats?userId=user123
```

### Health Check
```http
GET /health
```

## 🎤 Voice Command Examples

The system can process various natural language commands:

- "I did 15 push-ups"
- "I completed 3 sets of 10 squats"
- "I ran for 30 minutes"
- "I did 20 burpees"
- "I completed 5 sets of 8 deadlifts with 135 pounds"
- "I did 10 minutes of yoga"
- "I swam for 45 minutes"
- "I did 3 sets of 12 bicep curls with 25 pound dumbbells"

## 🏗️ Project Structure

```
exerciseapp/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── routes/
│   ├── voice.js          # Voice processing routes
│   └── exercises.js      # Exercise management routes
├── services/
│   └── voiceService.js   # OpenAI integration and voice processing
├── middleware/
│   └── validation.js     # Input validation middleware
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `JWT_SECRET` | JWT secret for auth | Required |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🧪 Testing

Run tests:
```bash
npm test
```

## 🚀 Deployment

1. **Production build**
   ```bash
   npm start
   ```

2. **Environment setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set up proper CORS origins
   - Configure rate limiting

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation
- **Error Handling**: Secure error responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

**Note**: This is a development version. Database integration and authentication will be added in future updates. 