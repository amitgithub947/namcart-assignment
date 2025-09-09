# Full-Stack Notes App

A modern full-stack notes application built with React, FastAPI, and PostgreSQL. Features include real-time CRUD operations, user authentication, public note sharing, and optimistic concurrency control.

## Features

### Frontend (React + Vite + Tailwind CSS)
- **Authentication**: Register, login, logout with JWT tokens
- **Notes Management**: Create, read, update, delete notes
- **Public Sharing**: Generate shareable links with optional expiration
- **Optimistic Concurrency**: ETag-based version control to prevent lost updates
- **Responsive Design**: Clean, modern UI that works on all devices
- **Real-time Updates**: React Query for efficient data fetching and caching

### Backend (FastAPI + PostgreSQL)
- **RESTful API**: Complete CRUD operations with proper HTTP methods
- **JWT Authentication**: Access tokens (15min) and refresh tokens (7 days) in HttpOnly cookies
- **Database**: PostgreSQL with proper relationships and indexing
- **Concurrency Control**: Version-based optimistic locking with ETag headers
- **Public Sharing**: Secure slug-based public note access with expiration
- **CORS Configuration**: Secure cross-origin requests

## Architecture

### Frontend Structure
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # API client and utilities
├── pages/              # Route components
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

### Backend Structure
```
backend/
├── app/
│   ├── routers/        # API route handlers
│   ├── models.py       # SQLAlchemy database models
│   ├── schemas.py      # Pydantic request/response schemas
│   ├── security.py     # Authentication utilities
│   ├── dependencies.py # FastAPI dependencies
│   ├── database.py     # Database configuration
│   └── config.py       # Application settings
├── main.py             # FastAPI application entry point
├── requirements.txt    # Python dependencies
└── Dockerfile          # Container configuration
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `created_at` (DateTime)

### Notes Table
- `id` (UUID, Primary Key)
- `owner_id` (UUID, Foreign Key → users.id)
- `title` (String)
- `content` (Text)
- `is_archived` (Boolean)
- `is_public` (Boolean)
- `public_slug` (String, Unique, Nullable)
- `share_expires_at` (DateTime, Nullable)
- `version` (Integer) - For optimistic concurrency control
- `created_at` (DateTime)
- `updated_at` (DateTime)

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - Clear authentication cookies
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info

### Notes Management
- `GET /api/notes` - List user's notes
- `POST /api/notes` - Create new note
- `GET /api/notes/{id}` - Get specific note (with ETag)
- `PUT /api/notes/{id}` - Update note (requires If-Match header)
- `PATCH /api/notes/{id}` - Partial update note
- `DELETE /api/notes/{id}` - Delete note

### Sharing
- `POST /api/notes/{id}/share` - Make note public and get share URL
- `DELETE /api/notes/{id}/share` - Remove public access
- `GET /public/{slug}` - Access public note (no auth required)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your API URL:
   ```
   VITE_API_BASE=http://localhost:8000
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment file:
   ```bash
   cp .env.example .env
   ```

5. Update `.env` with your database URL and secret key:
   ```
   DATABASE_URL=postgresql://user:password@localhost/notesdb
   SECRET_KEY=your-super-secret-jwt-key
   ```

6. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variable: `VITE_API_BASE=https://your-api-domain.com`
3. Deploy automatically on push to main branch

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables:
   - `DATABASE_URL` (provided by the platform)
   - `SECRET_KEY` (generate a secure random string)
   - `ENVIRONMENT=production`
   - `ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app`
3. Deploy using the included Dockerfile

## Key Features Explained

### Optimistic Concurrency Control
The application uses ETag headers and version numbers to prevent lost updates:
- Each note has a `version` field that increments on every update
- The server sends an ETag header with the current version
- Clients must send an `If-Match` header when updating
- If versions don't match, a 409 Conflict error is returned

### Public Sharing
Notes can be shared publicly with:
- Unique random slugs for security
- Optional expiration times
- Read-only access for non-authenticated users
- Easy copy-to-clipboard functionality

### Authentication Flow
- JWT tokens stored in HttpOnly cookies for security
- Short-lived access tokens (15 minutes) with refresh capability
- Automatic token refresh on API calls
- Secure logout that clears all tokens

## Security Considerations

- Passwords hashed with bcrypt
- JWT tokens in HttpOnly cookies prevent XSS attacks
- CORS properly configured for production domains
- SQL injection prevention through SQLAlchemy ORM
- Input validation with Pydantic schemas
- Rate limiting and security headers recommended for production

## Development Notes

- Frontend uses React Query for efficient data fetching and caching
- Backend follows FastAPI best practices with proper dependency injection
- Database migrations handled through SQLAlchemy
- Comprehensive error handling and user feedback
- Responsive design with Tailwind CSS
- TypeScript for type safety throughout the application

This application demonstrates modern full-stack development practices with proper authentication, data management, and user experience considerations.