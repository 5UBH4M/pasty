# Pasty - Code Sharing Platform

## Project Overview

Pasty is a modern code sharing platform that allows users to quickly share code snippets with automatically generated short URLs. The platform is designed with a clean, intuitive interface and features a dark theme for better readability.

## Tech Stack

### Frontend

-   **Framework**: React with Vite
-   **Routing**: React Router DOM
-   **Styling**: TailwindCSS
-   **UI Components**: Custom components with Lucide React icons
-   **Notifications**: React Toastify
-   **HTTP Client**: Native Fetch API

### Backend

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB with Mongoose
-   **API**: RESTful architecture
-   **Security**: CORS enabled
-   **Environment**: dotenv for configuration

## Features

### Core Functionality

1. **Code Sharing**

    - Create and share code snippets
    - Auto-generated 4-character unique IDs
    - Support for custom filenames
    - Optional titles and descriptions
    - Automatic code formatting
    - Copy to clipboard functionality

2. **Code Viewing**

    - Syntax highlighting
    - Clean, readable interface
    - Share link copying
    - Code content copying

3. **Recent Pastes**
    - Browse recent code shares
    - Search by paste ID
    - Pagination support
    - Quick access to paste details

### Technical Features

1. **Frontend**

    - Responsive design
    - Dark theme optimized
    - Error handling with toast notifications
    - Tab indentation support
    - Character count limiting
    - Loading states and animations

2. **Backend**
    - Auto-expiring documents (7 days)
    - Unique ID generation
    - Input validation
    - Error handling
    - Rate limiting
    - Health check endpoint

## API Endpoints

### Base URL: `/api/gists`

1. **Create Gist**

    - Method: POST
    - Endpoint: `/`
    - Body:
        ```json
        {
            "code": "string",
            "title": "string (optional)",
            <!-- "fileName": "string (optional)" -->
        }
        ```

2. **Get Gist**

    - Method: GET
    - Endpoint: `/:id`
    - Response: Full gist details

3. **List All Gists**

    - Method: GET
    - Endpoint: `/`
    - Query Params:
        - page (default: 1)
        - limit (default: 20)

4. **Search Gist**
    - Method: GET
    - Endpoint: `/search/:id`
    - Response: Basic gist details

## Database Schema

### Gist Model

```javascript
{
  id: {
    type: String,
    required: true,
    unique: true,
    length: 4
  },
  code: {
    type: String,
    required: true,
    maxLength: 100000
  },
  title: {
    type: String,
    default: "Untitled",
    maxLength: 100
  },
  fileName: {
    type: String,
    default: "untitled.txt",
    maxLength: 50
  },
  createdAt: Date,
  expiresAt: Date // 7 days from creation
}
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── App.js               # Express application setup
│   │   ├── controllers/         # Request handlers
│   │   ├── db/                  # Database connection
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # API routes
│   │   └── utils/              # Utility functions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── index.css          # Global styles
│   └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:

    ```bash
    cd backend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create .env file:

    ```
    MONGODB_URI=your_mongodb_connection_string
    PORT=3000
    FRONTEND_URL=http://localhost:5173
    ```

4. Start the server:
    ```bash
    npm run dev
    ```

### Frontend Setup

1. Navigate to frontend directory:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create .env file:

    ```
    VITE_API_URL=http://localhost:3000
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```

## Security Considerations

-   Input validation and sanitization
-   CORS configuration
-   Request size limits
-   Auto-expiring documents
-   Error message sanitization
-   Rate limiting (recommended)

## Performance Optimization

-   Client-side caching
-   Pagination for listings
-   Efficient database indexing
-   Response compression
-   Optimized bundle size

## Future Enhancements

1. **Features**

    - User authentication
    - Private pastes
    - Paste encryption
    - Syntax highlighting
    - Comments system
    - Fork functionality

2. **Technical**
    - TypeScript migration
    - Redis caching
    - Rate limiting
    - API documentation
    - End-to-end testing

## License

MIT License

## Contributors

-   Backend Development: Original project structure
-   Frontend Development: React implementation
-   Documentation: Project overview and setup
