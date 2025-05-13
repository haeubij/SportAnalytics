# SportAnalytics

A web-based video analysis platform for sports, built with Angular and Node.js.

## Features

- User authentication (login/register)
- Video upload and management
- Video playback and analysis
- User profile management
- Secure file storage

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Angular CLI

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sport-analytics
```

2. Install frontend dependencies:
```bash
cd sport-analytics
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Create a `.env` file in the backend directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sport-analytics
JWT_SECRET=your-secret-key-here
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. Start the frontend development server:
```bash
cd sport-analytics
ng serve
```

4. Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
sport-analytics/
├── src/                    # Frontend source code
│   ├── app/
│   │   ├── components/     # Angular components
│   │   │   └── interfaces/     # TypeScript interfaces
│   │   └── ...
│   └── ...
├── backend/                # Backend source code
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── uploads/           # Video upload directory
└── ...
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/check-username/:username` - Check username availability
- GET `/api/auth/user` - Get user data

### Videos
- POST `/api/videos/upload` - Upload a video
- GET `/api/videos` - Get all videos
- GET `/api/videos/:id` - Get video by ID
- DELETE `/api/videos/:id` - Delete a video

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

