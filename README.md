# AI Ad Creative Generator (Monorepo)

## Overview
A production-ready monorepo foundation for an AI-powered Ad Creative Generator. This repo provides a clean, scalable base with a React frontend, Node.js/Express TypeScript backend, and a Python FastAPI AI service. MongoDB is integrated via Mongoose. No business logic is implemented yet.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Axios
- **Backend (API)**: Node.js, TypeScript, Express, MongoDB, Mongoose, Multer, Sharp, CORS, dotenv
- **AI Service**: Python, FastAPI, Torch, Diffusers, Transformers, OpenCV, Pillow

## Folder Structure
```
ai-ad-generator/
├── frontend/
│   └── react/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── styles/
│       │   └── main.tsx
│       ├── public/
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
│
├── backend/
│   ├── node/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── db.ts
│   │   │   ├── routes/
│   │   │   │   └── index.ts
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   │   └── upload.ts
│   │   │   ├── utils/
│   │   │   └── app.ts
│   │   ├── uploads/
│   │   ├── outputs/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── python/
│       ├── app/
│       │   ├── main.py
│       │   ├── routes.py
│       │   ├── schemas.py
│       │   └── utils.py
│       ├── models/
│       ├── requirements.txt
│       └── .env.example
│
├── .gitignore
└── README.md
```

## Prerequisites
- Node.js (LTS)
- Python 3.10+
- pip
- MongoDB running locally or a connection string

## Setup & Run

### 1) Backend (Node + TypeScript)
- Create env file:
```
cp backend/node/.env.example backend/node/.env
```
- Install dependencies:
```
cd backend/node
npm install
```
- Run in dev:
```
npm run dev
```
- Health check:
```
GET http://localhost:5000/health
```

### 2) AI Service (Python + FastAPI)
- (Optional) Create virtual environment
```
python -m venv .venv
.venv\Scripts\activate  # Windows
```
- Install dependencies:
```
cd backend/python
pip install -r requirements.txt
```
- Run service:
```
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health check:
```
GET http://localhost:8000/health
```

### 3) Frontend (React + Vite + TypeScript)
- Install dependencies:
```
cd frontend/react
npm install
```
- Run dev server:
```
npm run dev
```
- Open the app:
```
http://localhost:5173
```

## Environment
- Backend Node `.env` (example included):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_ads
PYTHON_AI_URL=http://localhost:8000
```

## Notes
- This repository only contains scaffolding. No generation logic or business flows yet.
- MongoDB connection is initialized; ensure MongoDB is running or update the `MONGO_URI`.
- File upload support is configured via Multer in the backend; routes will be added later.
