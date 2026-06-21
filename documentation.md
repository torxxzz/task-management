# TaskPulse Documentation

## Project Overview

 task management web application built with a React + Vite frontend and a FastAPI backend. It supports task creation, editing, filtering, sorting, categories, and task completion tracking.

The frontend consumes a REST API exposed by the backend to manage tasks and categories stored in a SQL database.

---

## Key Features

- Create, update, and delete tasks
- Mark tasks as completed or active
- Search tasks by title or description
- Filter tasks by status: all, active, completed
- Sort tasks by newest, priority, title, or due date
- Add and remove category labels
- Task stats dashboard showing totals and high-priority counts

---

## Frontend

### Stack

- React 19
- TypeScript
- Vite
- lucide-react icons

### Entry Point

- `src/main.tsx`
- `src/App.tsx`

`src/main.tsx` now validates the `#root` DOM element before calling `createRoot(...)`, preventing a startup error when the root element is missing.

### Key UI Components

- `src/components/Sidebar.tsx` — navigation, labels, category management, clear completed
- `src/components/StatsGrid.tsx` — stats summary cards
- `src/components/TaskList.tsx` — task list rendering and category filtering
- `src/components/TaskCard.tsx` — individual task card controls
- `src/components/TaskModal.tsx` — add / edit task modal form
- `src/components/Toast.tsx` — temporary message notifications

### Custom Hooks

- `src/hooks/UseTask.tsx` — main task state manager for the app. It:
  - loads tasks and stats from the backend
  - refreshes data when filters, search terms, sorting, or category selection change
  - handles creating, updating, toggling completion, deleting tasks, and clearing completed tasks
  - exposes loading and error state so the UI can show feedback
- `src/hooks/UseCategories.tsx` — category label manager. It:
  - loads labels from the backend
  - creates new category labels with a chosen color
  - deletes labels and keeps category state synced
- `src/hooks/UseToast.tsx` — toast notification manager. It:
  - stores the current message
  - provides a function to show toast messages from anywhere in the app
  - ensures users see success and error messages after API actions

These hooks separate UI logic from data fetching and make `App.tsx` simpler by providing reusable stateful behavior.

### API Client

- `src/api/TaskApi.tsx` — task REST handlers
- `src/api/categoryApi.tsx` — category REST handlers

### How the API works

The frontend communicates with the backend using a REST API under the `/api` path. The API client modules wrap `fetch()` with JSON request and response handling.

- `TaskApi.tsx` provides functions like `getTasks()`, `getStats()`, `createTask()`, `updateTask()`, `patchTask()`, `deleteTask()`, and `deleteCompleted()`.
- `categoryApi.tsx` provides functions like `getCategories()`, `createCategory()`, and `deleteCategory()`.
- Each call uses `apiFetch()` to send JSON to the backend and throw an error if the response is not OK.

`src/hooks/UseTask.tsx` drives data loading in the UI:

- `refresh()` loads task list and stats concurrently from `/api/tasks` and `/api/tasks/stats`.
- `addTask()`, `editTask()`, `toggleDone()`, `removeTask()`, and `clearDone()` call the appropriate API function and then refresh the local task state.
- State updates in the UI are triggered by the hook after the backend returns the latest task data.

### Frontend ↔ Backend connection

The frontend uses a relative `/api` base path for all backend requests. In development, Vite forwards those requests to the FastAPI backend using `vite.config.ts`:

- `server.proxy['/api'].target = 'http://127.0.0.1:8000'`

This means the browser can request `/api/tasks` while Vite transparently forwards the request to the backend service.

The request flow is:

1. User action triggers a component event in `App.tsx`.
2. The event handler calls a hook method from `UseTask` or `UseCategories`.
3. The hook calls an API client function in `src/api`.
4. `fetch()` sends HTTP request to `/api/...`.
5. Vite proxy forwards the request to FastAPI on `127.0.0.1:8000`.
6. FastAPI in `backend/main.py` handles the request and uses `backend/database.py` to get a DB session.
7. SQLAlchemy queries or updates the database using `backend/models.py`.
8. FastAPI returns JSON to the frontend.
9. The frontend updates component state with the returned data.

This clear separation lets the frontend focus on UI state and interaction while the backend handles data persistence, filtering, sorting, and business logic.

### Styles

- `src/App.css`
- `src/index.css`

---

## Backend

### Stack

- Python 3 — the backend programming language.
- FastAPI — the web framework that defines API endpoints and handles requests.
- SQLAlchemy — the ORM that maps Python models to database tables.
- Uvicorn — the ASGI server that runs the FastAPI app.
- CORS middleware — allows browser requests from the frontend to reach the backend.
- dotenv — loads configuration like `DATABASE_URL` from a `.env` file.

### Entry Point

- `backend/main.py`

### Database

- `backend/database.py` — SQLAlchemy engine, session, and database dependency
- `backend/models.py` — `TaskDB` and `CategoryDB` ORM models

### Backend Explanation

The backend is built with FastAPI and serves the REST API that the frontend consumes.

- `backend/main.py` defines API routes and uses Pydantic models for request validation and response formatting.
- `backend/database.py` creates a SQLAlchemy engine from `DATABASE_URL`, manages sessions, and provides `get_db()` for each request.
- `backend/models.py` defines ORM classes that map Python objects to database tables.

Request flow in the backend:

1. The frontend sends a request to `/api/...`.
2. FastAPI routes in `backend/main.py` receive the request.
3. `get_db()` opens a SQLAlchemy session and provides it to the route.
4. The route queries or updates the database using `TaskDB` or `CategoryDB`.
5. FastAPI returns JSON data back to the frontend.

This means the backend is responsible for data persistence, filtering, sorting, and validation, while the frontend handles the UI and interactions.

### API Routes

#### Task Endpoints

- `GET /api/tasks` — list tasks with query filters
  - query params: `filter` (`all|active|completed`), `search`, `sort` (`created|priority|title|due`), `category`
- `GET /api/tasks/stats` — task statistics
- `POST /api/tasks` — create a task
- `PUT /api/tasks/{task_id}` — update a task
- `PATCH /api/tasks/{task_id}` — patch a task
- `DELETE /api/tasks/{task_id}` — delete a task
- `DELETE /api/tasks?completed=true` — delete all completed tasks

#### Category Endpoints

- `GET /api/categories` — list categories
- `POST /api/categories` — create a category label
- `DELETE /api/categories/{name}` — delete a category label

### Models

- `TaskDB`
  - `id`, `title`, `desc`, `priority`, `category`, `due`, `completed`, `createdAt`
- `CategoryDB`
  - `id`, `name`, `color`, `bg`, `text`

---

## Setup Instructions

### Prerequisites

- Node.js and npm
- Python 3.x
- A SQL database accessible by the backend via `DATABASE_URL`

### Backend Setup

1. Open a terminal inside `backend`
2. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Create a `.env` file in `backend` with:
   ```bash
   DATABASE_URL=<your-database-url>
   ```
4. Run the API server:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

> The backend uses `backend.database.get_db()` and expects a working SQLAlchemy connection to the database.

### Frontend Setup

1. From the project root install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Development Scripts

- `npm run dev` — run frontend in development mode
- `npm run build` — build frontend for production
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

---

## Project Structure

- `src/` — frontend source code
  - `components/` — UI components
  - `hooks/` — custom React hooks
  - `api/` — frontend API client
- `backend/` — Python backend
  - `main.py` — FastAPI application
  - `models.py` — ORM models
  - `database.py` — database connection and session management

---

## Notes and Suggestions

- The backend currently persists tasks and categories in the configured SQL database.
- For production, consider adding authentication, input validation rules, and stronger error handling.
- Database migrations can be added with Alembic for schema versioning.
- If the project needs offline or local-only storage, the backend can be adapted to use SQLite or a file-based database.

---

## Contact

Use this document as the main reference for the current TaskPulse application and extend it as new features are added.
