# TEAMBUILDERS

TEAMBUILDERS is a hackathon management platform designed to support hackathon organizers, participants, teams, and judges through a unified web application.

## Technology Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Axios
- Zustand
- React Query

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis

## Project Structure

```text
TEAMBUILDERS/
├── backend/
│   ├── alembic/
│   └── app/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── store/
│   └── types/
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Python 3.11 or compatible version
- Node.js and npm
- Docker Desktop
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sumitrark/TEAMBUILDERS.git
cd TEAMBUILDERS
```

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d
```

The Docker Compose configuration starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Configure the backend

Create a `.env` file inside the `backend` directory using the environment variables required by `backend/app/core/config.py`.

Do not commit `.env` files or credentials.

### 4. Install backend dependencies

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 5. Run database migrations

```bash
alembic upgrade head
```

### 6. Start the backend

```bash
uvicorn app.main:app --reload
```

The API is available at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### 7. Configure and start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at:

```text
http://localhost:3000
```

## Development Commands

### Frontend

```bash
npm run dev
npm run build
npm run lint
```

### Backend

```bash
uvicorn app.main:app --reload
alembic upgrade head
```

## Environment and Security

- Keep secrets in local environment files.
- Never commit database passwords, API keys, or access tokens.
- Use environment-specific configuration for local development and deployment.
- Keep local environment files out of version control.

## Repository

GitHub: https://github.com/sumitrark/TEAMBUILDERS
