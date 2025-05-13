# SportAnalytics

A web project for video analysis of sports activities, consisting of an Angular frontend application and a Node.js backend with MongoDB database.

## 1. Project Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Community Edition)
- [Angular CLI](https://angular.io/cli) (v19)

### Clone Repository
```bash
git clone https://github.com/yourusername/SportAnalytics.git
cd SportAnalytics
```

### Install Backend Dependencies
```bash
cd backend
npm install
```

### Install Frontend Dependencies
```bash
cd ../sport-analytics
npm install
```

## 2. Starting the Database

### Start MongoDB
Ensure that MongoDB is installed on your system and start the MongoDB service:

#### Windows
```bash
# Start MongoDB as a service (if not already configured as a service)
mongod
```

#### macOS / Linux
```bash
# Start MongoDB
sudo systemctl start mongod
```

The database is accessible by default at `mongodb://localhost:27017/sport-analytics`.

## 3. Starting the Backend

### Configure Environment Variables (optional)
Create a `.env` file in the backend directory with the following content:

```
MONGODB_URI=mongodb://localhost:27017/sport-analytics
JWT_SECRET=your-secret-key
PORT=3000
```

### Start Backend Server
```bash
cd backend  # If you're not already in the backend directory
npm run dev  # Starts the server in development mode with automatic restart
```

The backend is now running at http://localhost:3000

## 4. Starting the Frontend

```bash
cd sport-analytics  # If you're not already in the frontend directory
npm start  # Starts the Angular development server
```

The frontend is now accessible at http://localhost:4200.

## API Endpoints

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Log in a user
- `GET /api/users/current` - Get current user

### Videos
- `GET /api/videos` - Get all videos
- `POST /api/videos/upload` - Upload a video
- `GET /api/videos/:id` - Get video by ID
- `DELETE /api/videos/:id` - Delete a video

## Project Structure

### Backend
- `server.js` - Main entry point of the application
- `routes/` - API routes
- `models/` - Data models
- `middleware/` - Middleware functions (e.g., authentication)
- `uploads/` - Directory for uploaded videos

### Frontend
- `src/app/components/` - Angular components
- `src/app/services/` - Angular services
- `src/app/interfaces/` - TypeScript interfaces
