# Adept AI Project Planner

An AI-powered project management application that helps you break down complex projects into actionable tasks using Google Gemini AI.

## Features

- **AI Task Generation** - Automatically break down projects into tasks
- **Project Management** - Create and manage multiple projects
- **Team Collaboration** - Invite team members with role-based access
- **Task Tracking** - Kanban board with To Do, In Progress, Done
- **Analytics Dashboard** - Track project progress and insights

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **AI:** Google Gemini

## Prerequisites

- Docker Desktop
- Node.js 18+
- Google Gemini API Key ([Get free here](https://makersuite.google.com/app/apikey))

## Project Structure

```
adept-ai-project-planner/
├── frontend/          # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── backend/           # FastAPI backend
    ├── app/
    └── docker-compose.yml
```

## How to Run

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd adept-ai-project-planner
```

### 2. Setup Backend
```bash
cd backend
cp env.example .env
# Edit .env and add your GEMINI_API_KEY
docker-compose up -d
cd ..
```

### 3. Setup Frontend
```bash
cd frontend
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
npm install
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/adept_db
SECRET_KEY=your-secret-key-at-least-32-characters
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Stop Services

```bash
# Stop frontend: Ctrl+C in terminal

# Stop backend:
cd backend
docker-compose down
```

## Troubleshooting

**Backend not starting?**
```bash
cd backend
docker-compose down
docker-compose up -d --build
```

**Frontend errors?**
```bash
cd frontend
npm install
npm run dev
```

**Port conflicts?**
```bash
# Change ports in backend/docker-compose.yml
# or kill the process using the port
```

## License

MIT

---

Built with ❤️ using FastAPI, React, and Google Gemini AI
