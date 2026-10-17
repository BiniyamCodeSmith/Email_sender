# Task Management API

A portfolio-ready REST API for managing personal tasks. Built with JavaScript, Node.js, Express, SQLite, JWT authentication, Zod validation, and automated tests.

## Features

- Register and log in with hashed passwords (bcrypt).
- JWT-protected endpoints.
- Create, list, read, update, and delete tasks.
- Task status, priority, optional due date, and description.
- Filter by status and priority; search titles/descriptions.
- Pagination and safe sorting.
- Per-user data isolation: a user cannot read or modify another user's tasks.
- Request validation, security headers, login rate limiting, and centralized error responses.
- Automated API tests using Node's test runner and Supertest.

## Requirements

- Node.js 20 or newer
- npm (included with Node.js)
- Git (for publishing to GitHub)

## Run locally

```bash
git clone https://github.com/YOUR-USERNAME/task-management-api.git
cd task-management-api
npm install
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to a long, random value. The default development secret is only for local experimentation; never deploy with it. The `data/` folder and SQLite database are created automatically.

Start in development mode:

```bash
npm run dev
```

Or run normally:

```bash
npm start
```

The server listens on `http://localhost:3000` by default. Check it:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok"}
```

## Run tests

```bash
npm test
```

Tests use an in-memory SQLite database, so they do not alter your local `data/tasks.db` file.

## API overview

Base URL: `http://localhost:3000/api/v1`

All successful responses use a `data` object except `DELETE`, which returns `204 No Content`. Errors use an `error` object.

| Method | Endpoint | Auth? | Purpose |
|---|---|---:|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Get JWT token |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/tasks` | Yes | Create task |
| GET | `/tasks` | Yes | List/filter tasks |
| GET | `/tasks/:id` | Yes | Read one task |
| PATCH | `/tasks/:id` | Yes | Update task fields |
| DELETE | `/tasks/:id` | Yes | Delete task |

### 1. Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Biniyam","email":"biniyam@example.com","password":"StrongPass123"}'
```

The response includes a user object and JWT token. Keep the token private.

### 2. Save the token

Copy the returned token into your terminal:

```bash
TOKEN="paste-your-token-here"
```

For real projects, do not commit tokens, credentials, or `.env` files.

### 3. Create a task

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish portfolio API","description":"Write README and tests","priority":"high","due_date":"2026-12-31"}'
```

Accepted values:
- `status`: `pending`, `in_progress`, `completed`
- `priority`: `low`, `medium`, `high`
- `due_date`: `YYYY-MM-DD` or `null`

On creation, `description`, `status`, and `priority` default to an empty string, `pending`, and `medium` respectively.

### 4. List, filter, search, and paginate

```bash
curl "http://localhost:3000/api/v1/tasks?status=pending&priority=high&page=1&limit=10&sort=created_at&order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

Search text in task titles and descriptions:

```bash
curl "http://localhost:3000/api/v1/tasks?q=portfolio" \
  -H "Authorization: Bearer $TOKEN"
```

Query parameters:
- `status`: optional task status
- `priority`: optional priority
- `q`: optional search text
- `page`: page number, defaults to `1`
- `limit`: results per page, defaults to `10`, maximum `100`
- `sort`: `created_at`, `due_date`, `priority`, or `title`
- `order`: `asc` or `desc`

### 5. Update a task

Replace `1` with a task ID you own:

```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### 6. Delete a task

```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/1 \
  -H "Authorization: Bearer $TOKEN"
```

A successful delete returns HTTP `204`.

## Project structure

```text
task-management-api/
├── src/
│   ├── app.js                  # Express app and middleware
│   ├── config.js               # Environment configuration
│   ├── db.js                   # SQLite connection and schema
│   ├── server.js               # Starts HTTP server and handles shutdown
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── error-handler.js     # Consistent error responses
│   ├── routes/
│   │   ├── auth.js              # Register, login, current user
│   │   └── tasks.js             # Task CRUD and list query
│   ├── utils/
│   │   └── http-error.js        # HTTP error helper
│   └── validation/
│       ├── auth.js              # Auth request schemas
│       └── tasks.js             # Task request/query schemas
├── test/
│   ├── helpers.js
│   ├── auth.test.js
│   └── tasks.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Design notes

- **Routes** handle HTTP requests and call validation/database operations.
- **Zod** rejects malformed input before it reaches SQL queries.
- **SQLite prepared statements** bind user-provided values rather than concatenating them into SQL. Sort columns are selected from a fixed allowlist.
- **bcrypt** stores password hashes instead of plain-text passwords.
- **JWT middleware** protects task endpoints.
- **Every task query is scoped to the authenticated user's ID**, including reads, updates, and deletes.
- **Tests** use an isolated in-memory database.

## Security and production considerations

This is a learning/portfolio project, not a fully audited production service. Before public deployment:
- Set a strong, private `JWT_SECRET` and configure `NODE_ENV=production`.
- Use HTTPS and a specific `CORS_ORIGIN`.
- Consider short-lived access tokens plus refresh-token rotation/revocation.
- Add structured logging, monitoring, backups, and deployment-specific rate limits.
- Review database concurrency and storage needs before scaling beyond a single instance.
- Avoid returning internal errors or secrets to clients.

## Push this project to GitHub

Create an **empty** repository named `task-management-api` on GitHub. Do not initialize it with a README if you already have this one locally.

Then run these commands from the project folder:

```bash
git init
git add .
git commit -m "Build task management REST API"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/task-management-api.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. GitHub may prompt you to authenticate using a browser or personal access token; never put credentials in the remote URL.

## Good next improvements

1. Add Swagger/OpenAPI documentation.
2. Add due-date sorting tests and stronger edge-case tests.
3. Add Docker support and a CI workflow to run tests on every push.
4. Deploy the API and add a live demo link to this README.
5. Add a frontend client in a separate repository.
