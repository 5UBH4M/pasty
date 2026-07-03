# Pasty 📋

A fast, minimal code sharing tool. Paste your code, get a 4-letter ID, share it with anyone.

## Features

- **Create** — Paste code and get a shareable 4-letter ID instantly
- **Search** — Look up any paste by its 4-letter ID or pasted link
- **Copy ID** — One-click copy of the paste ID for easy sharing
- **Copy Code / Link** — Quickly copy code content or the full shareable URL
- **Auto-expiry** — Pastes automatically expire after 7 days
- **Tab support** — Tab key inserts spaces in the code editor

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4   |
| Backend  | Express 5, Mongoose              |
| Database | MongoDB Atlas                     |

## Project Structure

```
Pasty/
├── backend/
│   └── src/
│       ├── App.js              # Express server entry point
│       ├── db/connectToDB.js   # MongoDB connection
│       ├── controllers/        # Route handlers
│       ├── models/             # Mongoose schemas
│       ├── routes/             # API routes
│       └── utils/              # ID generation helpers
├── frontend/
│   └── src/
│       ├── App.jsx             # React router setup
│       ├── pages/              # CreateCode, ViewCode, Search
│       └── services/api.js     # Backend API client
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)

### 1. Clone the repo

```bash
git clone https://github.com/5UBH4M/pasty.git
cd pasty
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=Pasty
PORT=3000
FRONTEND_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

Start the dev server:

```bash
npm run dev
```

### 4. Open the app

Visit **http://localhost:5173** in your browser.

## API Endpoints

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| POST   | `/api/gists`           | Create a new paste       |
| GET    | `/api/gists`           | List all pastes (paged)  |
| GET    | `/api/gists/:id`       | Get a paste by ID        |
| GET    | `/api/gists/search/:id`| Search paste by ID       |
| GET    | `/health`              | Server health check      |

## License

MIT
