Project Overview
NOTE: DUE TO LACK OF TIME I TRIED TO FOCUS ON THE FUNCTIONALITY RATHER THEN UI ENHANCEMENTS






The Project Management System (PMS) is a full‑stack web application that enables an Admin user to create and manage projects and tasks, while Member users can view assigned projects, start tasks, and submit their work. Submissions consist of a URL (e.g., GitHub repo or live demo) and a free‑form description. After a submission the related task or project status updates to Completed and the submitted data is displayed for both the member and the admin.

Key functional requirements:

Role‑based access control (Admin vs Member).
Projects contain multiple tasks.
Members can submit work for a project or a task via a clean form (empty by default, no pre‑filled data).
The UI never shows a completed state before a submission.
After submission, a success message is shown, the status changes to Completed, and the submitted URL and description are displayed.
2. Technology Stack
Layer	Technology	Reason
Frontend	React (functional components, hooks) + Vite	Fast development, hot‑module replacement, modern ES modules
Styling	Vanilla CSS (index.css)	Full control over design, no external CSS frameworks
Routing	react-router-dom	Declarative navigation, protected routes
HTTP Client	Axios (src/api.js)	Simple promise‑based request handling
Backend	FastAPI (Python)	Automatic OpenAPI docs, async support
ORM	SQLAlchemy (Core + ORM)	Easy SQLite integration, migration helper
Database	SQLite (sql_app.db)	Lightweight, file‑based persistence suitable for a demo
Authentication	JWT (HS256) stored in localStorage	Stateless token authentication, simple to implement
Development Tools	Vite dev server, Uvicorn ASGI server	Fast reload cycles for frontend and backend
3. Architecture
frontend/
│
├─ src/
│   ├─ components/          # reusable UI components (Sidebar, Layout, etc.)
│   ├─ pages/
│   │   ├─ Dashboard.jsx   # main landing page after login
│   │   ├─ Projects.jsx    # project list view
│   │   ├─ ProjectDetail.jsx# project detail + submission form
│   │   ├─ Tasks.jsx        # task list view (filtered by project)
│   │   ├─ TaskDetail.jsx   # task detail + submission form
│   │   ├─ Auth.jsx         # login / signup page
│   │   └─ ...              # other pages
│   ├─ api.js               # central Axios instance with auth interceptor
│   └─ App.jsx               # router & protected route handling
│
backend/
│
├─ app.py                # FastAPI entry point, DB init, migration helper
├─ models.py             # SQLAlchemy models (User, Project, Task, TaskSubmission)
├─ schemas.py            # Pydantic schemas for request/response validation
├─ routes/
│   ├─ __init__.py      # include routers
│   ├─ auth.py           # login / register
│   ├─ project_routes.py# CRUD + submit endpoint for projects
│   └─ task_routes.py   # CRUD + submit endpoint for tasks
└─ requirements.txt      # Python dependencies
Frontend → Backend: All API calls go to /api/... (proxied by Vite).
Backend → Database: SQLAlchemy models map directly to SQLite tables.
Migration Helper: On server start, missing columns (submission_link, submission_notes) and the new task_submissions table are added automatically.
4. Data Model
Model	Fields	Description
User	id, username, hashed_password, role (admin/member)	Authentication and role separation
Project	id, title, description, deadline, owner_id (admin)	Top‑level container
Task	id, title, description, deadline, status (Pending, In Progress, Completed), project_id, user_id (assigned member)	Work items under a project
TaskSubmission	id, task_id, user_id, submission_url, tags, description, created_at	Stores member's submitted work for a task
ProjectSubmission (implicit)	Stored directly on Project (submission_link, submission_notes) after submission	Allows admin to view project work
All tables are linked via foreign keys, ensuring referential integrity.

5. API Specification
All endpoints return JSON and enforce the role‑based permission via a Depends(get_current_user) dependency.

Authentication
POST /auth/register – Register new user.
POST /auth/login – Returns JWT token.
Projects
GET /projects – List projects visible to the requester.
GET /projects/{id} – Project details (including tasks).
POST /projects – Admin only – create a new project.
POST /projects/{id}/submit – Member only – submit URL and notes; updates status to Completed.
Tasks
GET /tasks – List tasks (filtered by user).
GET /tasks/{id} – Task details.
POST /tasks – Admin only – create a new task.
POST /tasks/{id}/submit – Member only – submit URL, tags, and description; updates status.
GET /tasks/{id}/submissions – Admin can view all, member sees only their own.
All request/response bodies are defined in schemas.py. Validation errors automatically generate a 422 response with details.

6. Frontend Structure & UI Flow
General UI
Sidebar with navigation links (Dashboard, Projects, Tasks, Logout).
Protected routes: PrivateRoute redirects unauthenticated users to the login page.
Member Flow
Dashboard – overview of assigned projects/tasks.
Projects – list of projects. Clicking a project navigates to ProjectDetail.
ProjectDetail – shows project meta, task list, and a submission form (URL + description) at the top.
Form fields are empty, disabled until both are filled.
On submit, the form posts to /projects/{id}/submit, shows a success toast, updates the status to Completed, and renders the submitted data (clickable URL and description).
Tasks – filtered list of tasks that belong to the selected project or to the current member.
TaskDetail – similar to ProjectDetail but includes an extra Tags field. Submission follows the same flow.
Admin Flow
All of the above UI is visible, plus Create Project, Create Task, Delete, and Edit actions.
Admin can view any member’s submissions via the “Submitted” section inside each card.
UI Elements (strictly follow the requested design)
Project URL Input – placeholder: Enter your project URL (GitHub / Live Link).
Project Description Textarea – placeholder: Describe your work / paste your content here.
Submit Button – label Submit Project; disabled while any field is empty.
Identical UI for task submission (additional Tags input).
All components use functional React hooks (useState, useEffect) and the centralized Axios instance (api.js) that injects the JWT token into request headers.

7. Authentication & Authorization
Login stores JWT in localStorage.
Axios interceptor adds Authorization: Bearer <token> to each request.
Backend verifies token in dependencies.py (get_current_user) and raises HTTPException(401) if invalid.
Role checks (if current_user.role != "admin": raise HTTPException(403)) guard admin‑only routes.
Member routes verify that the user_id matches the logged‑in user before allowing a submission.
8. Database Migration
The migrate_db() function in backend/app.py runs on server start and:

Adds missing columns submission_link and submission_notes to the tasks table (if they do not exist).
Creates the task_submissions table with proper foreign keys.
Any errors are silently ignored, making the migration idempotent.
This approach avoids manual Alembic migrations for this demo project while guaranteeing schema correctness.

9. Installation & Running Locally
Prerequisites
Node.js (>= 18)
Python (>= 3.11)
Git (optional, for version control)
Backend
bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app:app --reload
Backend will be reachable at http://127.0.0.1:8000.

Frontend
bash
cd frontend
npm install
npm run dev
The Vite development server runs at http://localhost:5173 and proxies /api/* to the backend.

First Run
Register the first user via the Signup page.
Manually set that user’s role to admin in the SQLite DB (or edit backend/seed_data.py if you have it).
Use the admin account to create projects and tasks.
Log in as a member to test the submission flow.
10. Production Deployment
Build the frontend: npm run build.
Serve the dist/ folder with a static file server (NGINX, Apache) or via FastAPI’s StaticFiles.
Run the backend with a production ASGI server (gunicorn -k uvicorn.workers.UvicornWorker app:app).
Store secrets (JWT secret, database path) in environment variables; use python-dotenv for loading.
For scalability, replace SQLite with PostgreSQL or MySQL and run proper Alembic migrations.
11. Design Decisions
Custom CSS instead of a UI framework ensures a lightweight bundle and full control over the visual design (color palette, spacing, micro‑animations).
Single‑page submission flow (no pre‑filled data) complies with the strict UI requirement that a submission form appears empty and only after a successful post the data is shown.
Automatic migration provides a quick way to evolve the schema without manual steps in a learning/demo environment.
Role‑based checks are performed both on the client (conditional rendering) and server (dependency injection) to avoid unauthorized actions.
12. Limitations & Future Work
No pagination or search for long project/task lists.
No file uploads; only URLs and text are accepted.
Limited error handling on the frontend (only basic toasts).
Testing: currently no unit or integration tests; adding pytest suites for the API would improve reliability.
Real‑time updates: could be added via WebSockets to push status changes instantly to connected admins.
Environment management: a .env.example could be provided, and python-dotenv used to load configuration.
