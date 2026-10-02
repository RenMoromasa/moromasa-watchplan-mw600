# WatchPlan

Movie & series tracker. React + TypeScript frontend (Vite) with a PHP + MySQL backend served by XAMPP.

## Project structure

```
backend/            PHP API (served by XAMPP Apache)
  config.php        Database credentials & allowed CORS origins
  bootstrap.php     Shared helpers: PDO connection, JSON responses, validation
  database.sql      MySQL schema (tables: media, tasks)
  api/media.php     Movies/Series CRUD
  api/tasks.php     Tasks CRUD
  api/external.php  External search (TVMaze public API)
frontend/           React app
  src/api.ts        API client used by every page
```

## Setup

### 1. Start XAMPP

Open the XAMPP Control Panel and start **Apache** and **MySQL**.

### 2. Create the database

Open http://localhost/phpmyadmin, go to **Import**, choose `backend/database.sql` and click **Go**.
Or, from a terminal:

```bash
C:/xampp/mysql/bin/mysql.exe -u root < backend/database.sql
```

### 3. Put the backend in `htdocs`

Apache only serves files under `C:\xampp\htdocs`. Either copy the `backend` folder there as `watchplan`,
or link it so edits apply immediately (run in **cmd** as Administrator):

```bash
mklink /J "C:\xampp\htdocs\watchplan" "C:\Users\Ren Moromasa\OneDrive\Documents\Integ Programming\WatchPlan\backend"
```

Check it works: http://localhost/watchplan/api/media.php should return `{"success":true,"count":0,"data":[]}`.

### 4. Run the frontend

Requires **Node.js 20.19+** (Vite 8).

```bash
npm install --prefix frontend
```

```bash
npm run dev:frontend
```

Open http://localhost:5173.

If the backend lives at a different URL, copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_URL`.

## API

| Method | Endpoint                 | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `api/media.php`          | List movies/series (`?search=&type=&status=`) |
| GET    | `api/media.php?id=1`     | Get one                                       |
| POST   | `api/media.php`          | Create                                        |
| PUT    | `api/media.php?id=1`     | Update                                        |
| DELETE | `api/media.php?id=1`     | Delete (also deletes its tasks)               |
| GET    | `api/tasks.php`          | List tasks (`?mediaId=&status=`)              |
| GET    | `api/tasks.php?id=1`     | Get one                                       |
| POST   | `api/tasks.php`          | Create                                        |
| PUT    | `api/tasks.php?id=1`     | Update                                        |
| DELETE | `api/tasks.php?id=1`     | Delete                                        |
| GET    | `api/external.php?query=`| Search TVMaze                                 |
