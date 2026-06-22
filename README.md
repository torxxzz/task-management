# Task Management

Task Management is a simple task management app with a React + Vite frontend and a FastAPI backend. It supports task creation, editing, completion, filtering, sorting, categories, and light/dark mode.

## Overview

- `src/` � frontend React source code.
- `backend/` � FastAPI backend, database models, and API routes.
- `vite.config.ts` � configures the frontend dev server and API proxy to `/api`.

## Key features

- Create, update, delete tasks.
- Mark tasks complete or active.
- Search tasks by title or description.
- Filter tasks by category and status.
- Sort by created date, priority, title, or due date.
- Light / dark theme toggle saved in localStorage.
- Backend health route and full task/category REST API.

## Dependencies

### Frontend

- `react` — UI library for building interactive components.
- `react-dom` — renders React components to the browser DOM.
- `vite` — fast frontend dev server and build tool.
- `@vitejs/plugin-react` — enables React support in Vite.
- `lucide-react` — icon library used for buttons and UI controls.
- `@supabase/supabase-js` — client library for Supabase, included here for future backend integration.

### Backend

- `fastapi` — Python web framework for building APIs quickly.
- `uvicorn[standard]` — ASGI server used to run the FastAPI app.
- `sqlalchemy` — ORM for database access and models.
- `python-dotenv` — loads `.env` config values like `DATABASE_URL`.

## Setup

### 1. Install frontend dependencies

```bash
cd .
npm install
```

### 2. Install backend dependencies

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3. Configure backend environment

Create `backend/.env` and add a `DATABASE_URL` value with your actual database credentials:

```.env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/task_management
```

Replace `your_username` and `your_password` with your actual PostgreSQL credentials. If using a different database host or port, update those as well.

## Run the app

### Start the backend

```bash
cd backend
python main.py
```

This starts the FastAPI server at `http://127.0.0.1:8000` with auto-reload enabled.

### Start the frontend

In a separate terminal:

```bash
cd .
npm run dev
```

## Useful scripts

- `npm run dev` � start the frontend in development mode.
- `npm run build` � produce a production build.
- `npm run preview` � preview the production build.
- `npm run lint` � run ESLint on the frontend code.

## Project structure

- `src/App.tsx` � main app state, search, sort, theme, and task actions.
- `src/components/Sidebar.tsx` � sidebar navigation, categories, and clear completed.
- `src/components/TaskList.tsx` � task list and category filter UI.
- `src/components/TaskCard.tsx` � individual task card display and actions.
- `src/components/TaskModal.tsx` � modal form for creating and editing tasks.
- `src/components/Toast.tsx` � toast notifications for success and errors.
- `src/hooks/UseTask.tsx` � loads tasks/stats and handles task CRUD operations.
- `src/hooks/UseCategories.tsx` � manages category labels and lookup.
- `src/hooks/UseToast.tsx` � toast state and show function.
- `src/api/TaskApi.tsx` � task API client functions.
- `src/api/categoryApi.tsx` � category API client functions.
- `src/index.css` � global styles and theme variables.
- `backend/main.py` � FastAPI routes and validation.
- `backend/database.py` � SQLAlchemy engine, session, and environment loading.
- `backend/models.py` � SQLAlchemy ORM models for tasks and categories.
- `backend/requirements.txt` � backend Python dependencies.

## API routes

- `GET /` � health check: `{ "message": "Backend is running" }`.
- `GET /api/tasks` � fetch task list.
- `GET /api/tasks/stats` � fetch task statistics.
- `POST /api/tasks` � create a task.
- `PUT /api/tasks/{task_id}` � update a task.
- `PATCH /api/tasks/{task_id}` � patch a task.
- `DELETE /api/tasks/{task_id}` � delete a task.
- `DELETE /api/tasks?completed=true` � delete completed tasks.
- `GET /api/categories` � list categories.
- `POST /api/categories` � create a category.
- `DELETE /api/categories/{name}` � delete a category.

## Walkthrough notes

- Start with `src/App.tsx` to explain how frontend state and handlers connect.
- Show how `UseTask` fetches data and exposes CRUD methods.
- Demonstrate the task modal as a single add/edit form.
- Explain the theme toggle and localStorage persistence.
- Show `vite.config.ts` proxy so frontend `/api` calls reach the backend.
- Walk through backend routes in `backend/main.py` and the database models.

## Troubleshooting

- If the frontend cannot reach the backend, verify backend is running at `http://127.0.0.1:8000`.
- If `http://127.0.0.1:8000` returns 404, use `/` for the health route.
- If the backend fails to start, ensure `backend/.env` exists and `DATABASE_URL` is set.
- If API calls fail, confirm the frontend proxy config in `vite.config.ts`.
