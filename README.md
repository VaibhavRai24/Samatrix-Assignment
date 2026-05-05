Project Overview
NOTE: DUE TO LACK OF TIME I TRIED TO FOCUS ON THE FUNCTIONALITY RATHER THEN UI ENHANCEMENTS






The Project Management System (PMS) is a full‑stack web application that lets Admins create projects and tasks, while Members view assigned projects, start tasks, and submit their work. Submissions consist of a URL and a description. After a successful submission the status changes to Completed and the submitted data is displayed.

Technology Stack
Layer	Technology
Frontend	React (hooks) + Vite
Styling	Vanilla CSS
Routing	react‑router‑dom
HTTP Client	Axios (src/api.js)
Backend	FastAPI
ORM	SQLAlchemy
Database	SQLite
Auth	JWT stored in localStorage
Dev Servers	Vite (frontend) and Uvicorn (backend)
Architecture
frontend/
│   src/
│   │   components/        # reusable UI pieces (Sidebar, Layout, etc.)
│   │   pages/
│   │       Dashboard.jsx
│   │       Projects.jsx
│   │       ProjectDetail.jsx
│   │       Tasks.jsx
│   │       TaskDetail.jsx
│   │       Auth.jsx
│   │   api.js
│   │   App.jsx
│   │   main.jsx
│   index.css
│   vite.config.js
│   index.html
backend/
│   app.py                # FastAPI entry point, migration helper
│   models.py             # SQLAlchemy models
│   schemas.py            # Pydantic schemas
│   routes/
│       __init__.py
│       auth.py
│       project_routes.py
│       task_routes.py
│   requirements.txt
Frontend makes API calls to /api/... (proxied by Vite).
Backend exposes REST endpoints, validates with Pydantic, and interacts with SQLite via SQLAlchemy.
Migration helper runs on server start to add missing columns and the task_submissions table.
Data Model
Model	Fields
User	id, username, hashed_password, role (admin / member)
Project	id, title, description, deadline, owner_id
Task	id, title, description, deadline, status, project_id, user_id
TaskSubmission	id, task_id, user_id, submission_url, tags, description, created_at
ProjectSubmission (implicit)	submission_link, submission_notes stored on Project after member submits
All foreign keys enforce referential integrity.

API Specification
Authentication
POST /auth/register – Register a new user.
POST /auth/login – Return JWT token.
Projects
GET /projects – List visible projects.
GET /projects/{id} – Project details (includes tasks).
POST /projects – Admin only – create a project.
POST /projects/{id}/submit – Member submits URL & notes; status → Completed.
Tasks
GET /tasks – List tasks for the current member.
GET /tasks/{id} – Task details.
POST /tasks – Admin only – create a task.
POST /tasks/{id}/submit – Member submits URL, tags, description; status → Completed.
GET /tasks/{id}/submissions – Admin sees all, member sees own.
All request/response bodies are defined in schemas.py.

Frontend Structure & UI Flow
General UI
Sidebar with navigation links (Dashboard, Projects, Tasks, Logout).
Protected routes (PrivateRoute) redirect unauthenticated users to the login page.
Member Flow
Dashboard – overview of assignments.
Projects – list of projects; clicking a project opens ProjectDetail.
ProjectDetail – shows project info and a submission form at the top:
Project URL Input – placeholder: Enter your project URL (GitHub / Live Link).
Description Textarea – placeholder: Describe your work / paste your content here.
Submit Button – label Submit Project, disabled while fields are empty.
After submit, a success message appears, status changes to Completed, and the submitted URL & description are displayed.
Tasks – list of tasks belonging to the selected project.
TaskDetail – same UI pattern as ProjectDetail, with an additional Tags input.
Admin Flow
Same UI, plus buttons to Create, Edit, and Delete projects and tasks.
Admin can view any member’s submissions in the “Submitted” section of each card.
All components use functional React hooks (useState, useEffect) and the centralized Axios instance (api.js) that injects the JWT token.

Authentication & Authorization
Login stores JWT in localStorage.
Axios interceptor adds Authorization: Bearer <token> to every request.
Backend validates token using get_current_user.
Role checks (if current_user.role != "admin": raise HTTPException(403)) protect admin routes.
Member routes verify that the authenticated user matches the user_id of the resource before allowing modifications.
Database Migration
migrate_db() in backend/app.py runs on startup and:

Adds missing columns (submission_link, submission_notes) to tasks if absent.
Creates task_submissions table with proper foreign keys.
The migration is idempotent, so repeated runs are safe.
Installation & Running Locally
Prerequisites
Node.js (≥ 18)
Python (≥ 3.11)
Git (optional)
Backend
bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app:app --reload
Backend URL: http://127.0.0.1:8000.

Frontend
bash
cd frontend
npm install
npm run dev
Frontend URL: http://localhost:5173.

Register a user via the Signup page.
Manually set the first user's role to admin in the SQLite DB (or use a seed script).
Use the admin account to create projects and tasks.
Log in as a member to test the submission workflow.
Production Deployment
Build the frontend: npm run build.
Serve the dist/ folder with a static server (NGINX, Apache) or via FastAPI’s StaticFiles.
Run the backend with a production ASGI server, e.g., gunicorn -k uvicorn.workers.UvicornWorker app:app.
Store secrets (JWT secret, DB path) in environment variables; consider using python-dotenv.
Replace SQLite with PostgreSQL/MySQL for scalability and run proper Alembic migrations.
Design Decisions
Vanilla CSS for full control over the visual design and minimal bundle size.
Single‑page submission flow (empty fields, no pre‑filled data) to meet strict UI requirements.
Automatic migration simplifies schema evolution in a demo environment.
Role‑based checks are enforced both on client and server sides for security.
Limitations & Future Work
No pagination or search for large project/task lists.
No file upload support; only URLs and text are accepted.
Basic error handling on the frontend (toast messages).
No automated tests; adding pytest suites would improve reliability.
Real‑time updates (WebSockets) could be added for instant status changes.
Environment management (.env files) could be standardized for deployment.
