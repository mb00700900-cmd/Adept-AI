# 🚀 Adept AI Project Planner - Backend API

FastAPI backend for AI-powered project management application.

## 📋 **Features**

- ✅ **Authentication**: JWT-based user authentication
- ✅ **Project Management**: CRUD operations for projects
- ✅ **AI Task Generation**: Google Gemini integration for task decomposition
- ✅ **Team Collaboration**: Role-based access control (Owner/Editor/Viewer)
- ✅ **Analytics**: Project metrics and AI accuracy tracking
- ✅ **Database**: PostgreSQL with SQLAlchemy ORM
- ✅ **Security**: Password hashing, JWT tokens, RBAC

## 🛠️ **Tech Stack**

- **Framework**: FastAPI 0.109.2
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0.27
- **Authentication**: JWT (python-jose)
- **Password Hashing**: Bcrypt
- **AI**: Google Gemini 2.5 Flash
- **Validation**: Pydantic 2.6
- **Migrations**: Alembic 1.13

## 📁 **Project Structure**

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── dependencies.py      # FastAPI dependencies
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/v1/              # API routes (to be added)
│   ├── services/            # Business logic (to be added)
│   └── core/                # Core utilities
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🚀 **Quick Start**

### **Option 1: Using Docker (Recommended)**

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Copy environment file**
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` file** - Update these values:
   ```env
   SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

4. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Check if services are running**
   ```bash
   docker-compose ps
   ```

6. **Access the API**
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### **Option 2: Manual Setup (Without Docker)**

#### **Prerequisites**
- Python 3.11+
- PostgreSQL 15+
- pip or conda

#### **Steps**

1. **Clone and navigate**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   # Using venv
   python -m venv venv
   
   # Activate on Windows
   venv\Scripts\activate
   
   # Activate on Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Install PostgreSQL (if not installed)
   # Windows: Download from https://www.postgresql.org/download/windows/
   # Mac: brew install postgresql@15
   # Linux: sudo apt-get install postgresql-15
   
   # Create database
   psql -U postgres
   CREATE DATABASE adept_db;
   \q
   ```

5. **Configure environment variables**
   ```bash
   # Copy example env file
   cp env.example .env
   
   # Edit .env and update:
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/adept_db
   SECRET_KEY=your-secret-key-here
   GEMINI_API_KEY=your-gemini-api-key
   ```

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

7. **Access the API**
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🔑 **Environment Variables**

Copy `env.example` to `.env` and configure:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SECRET_KEY` | JWT secret key (min 32 chars) | Yes | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `FRONTEND_URL` | Frontend application URL | No | http://localhost:5173 |
| `ENVIRONMENT` | Environment (development/production) | No | development |
| `DEBUG` | Enable debug mode | No | True |

### **Generate SECRET_KEY**
```bash
# On Mac/Linux
openssl rand -hex 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### **Get GEMINI_API_KEY**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `.env`

## 📊 **Database Setup**

### **Using Alembic Migrations** (Recommended for production)

```bash
# Initialize Alembic (already done)
alembic init alembic

# Create a new migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### **Using SQLAlchemy** (Development only)

The application automatically creates tables on startup when `init_db()` is called.

## 🧪 **Testing**

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 📖 **API Documentation**

### **Interactive API Docs**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### **Key Endpoints** (Examples - to be fully implemented)

#### **Authentication**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info

#### **Projects**
- `GET /api/v1/projects` - List user's projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

#### **Tasks**
- `GET /api/v1/projects/{id}/tasks` - List project tasks
- `POST /api/v1/projects/{id}/tasks` - Create task
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task

#### **AI**
- `POST /api/v1/ai/task-decompose` - Generate tasks with AI

## 🐳 **Docker Commands**

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f api

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up -d --build

# Remove all containers and volumes
docker-compose down -v
```

## 🚢 **Deployment**

### **Production Checklist**

- [ ] Set strong `SECRET_KEY`
- [ ] Set `ENVIRONMENT=production`
- [ ] Set `DEBUG=False`
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure email service
- [ ] Set up logging
- [ ] Enable rate limiting
- [ ] Set up monitoring

### **Deploy to Cloud**

#### **Heroku**
```bash
heroku create adept-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set SECRET_KEY=your-secret
git push heroku main
```

#### **AWS/GCP/Azure**
Use Docker container or deploy directly with gunicorn/uvicorn.

## 🔧 **Development**

### **Code Quality**
```bash
# Format code
black app/

# Check linting
flake8 app/

# Type checking
mypy app/
```

### **Database Migrations**
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## 🐛 **Troubleshooting**

### **Issue: Database connection error**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs db

# Verify DATABASE_URL in .env
```

### **Issue: Module not found**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### **Issue: Port already in use**
```bash
# Change port in docker-compose.yml or .env
# Or stop the service using that port
```

## 📚 **Resources**

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Google Gemini AI](https://ai.google.dev/)

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit pull request

## 📄 **License**

MIT License

## 👥 **Team**

Adept Development Team

---

**Note**: This backend is ready for development. Additional API routes and services will be implemented based on requirements.

