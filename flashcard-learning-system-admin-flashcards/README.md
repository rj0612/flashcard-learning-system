# Flashcard Learning System

## Project Description

Flashcard Learning System is a modern single-page learning web application built for Assignment 2. It helps users create, manage, search, and study flashcards while recording learning history. The system includes authentication, role-based access control, flashcard management, and an admin dashboard for viewing user accounts and learning activity.

The website solves the problem of managing revision materials in a structured way. Students can create flashcards, mark them as studied, search through cards in real time, and track learning actions through a history log.

## Main Features

### Authentication and Users
- User registration
- User login
- Password hashing using bcryptjs
- JWT authentication
- User profile retrieval and update
- Account deletion endpoint
- Admin role support
- Admin can view users, change user roles, and delete users

### Flashcards
- Create flashcards
- Read flashcards
- Update flashcards
- Delete flashcards
- Live search by question, answer, or category
- Difficulty level selection
- Category support
- Mark as studied / move back to active
- Separate sections for studied and not-studied flashcards

### Learning History
- Records key learning actions
- Users can view their own history
- Admin users can view all users' learning history
- History stores flashcard snapshots so deleted-card actions remain understandable

## Assignment Requirements Mapping

| Requirement | Implementation |
|---|---|
| Modern frontend library | React with Vite |
| Backend with database | Node.js, Express, MongoDB, Mongoose |
| Single-page application behaviour | React app dynamically updates without page reloads |
| CRUD operations | Users, Flashcards, and Learning History |
| Authentication | JWT and bcryptjs password hashing |
| Live search | Search field filters flashcards as the user types |
| Admin/user profile feature | Admin panel displays users and learning history |
| GitHub-ready submission | Includes source code, README, `.gitignore`, and sample database export |

## Technical Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- lucide-react icons

### Backend
- Node.js
- Express.js
- MongoDB Atlas or local MongoDB
- Mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- cors

## Folder Structure

```text
flashcard-learning-system/
├── client/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       └── services/
│           └── api.js
│
├── server/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Flashcard.js
│   │   ├── User.js
│   │   └── ViewHistory.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── flashcardRoutes.js
│   │   ├── historyRoutes.js
│   │   └── userRoutes.js
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
│
├── database-export/
│   └── sample-data.json
│
├── .gitignore
├── package.json
└── README.md
```

## Installation and Setup

### 1. Install dependencies

From the root folder:

```bash
npm install
npm run install-all
```

Or install manually:

```bash
cd server
npm install
cd ../client
npm install
```

### 2. Configure environment variables

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=mongodb+srv://flashcardUser1:Wong_0612@cluster0.gwgptch.mongodb.net/flashcardDB?retryWrites=true&w=majority

JWT_SECRET=myverysecurejwtsecret

PORT=5001
```



### 3. Start the backend

```bash
cd server
npm run dev
```

Backend runs at:

```text
http://localhost:5001
```

### 4. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

### 5. Optional: seed sample data

After configuring `.env`, run:

```bash
cd server
npm run seed
```

Test accounts:

```text
admin123@gmail.com / admin123
student@gmail.com / student1

or feel free to create your own.
```

## Database Export

Database export is included in:

```text
database-export/
```

This file demonstrates the three core entities:

1. User
2. Flashcard
3. ViewHistory

## API Overview

### Auth Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `DELETE /api/auth/me`

### Flashcard Routes
- `GET /api/flashcards`
- `POST /api/flashcards`
- `PUT /api/flashcards/:id`
- `PATCH /api/flashcards/:id/studied`
- `POST /api/flashcards/:id/view`
- `DELETE /api/flashcards/:id`

### History Routes
- `GET /api/history/me`
- `GET /api/history/admin`
- `DELETE /api/history/:id`

### User Admin Routes
- `GET /api/users`
- `PUT /api/users/:id/role`
- `DELETE /api/users/:id`

## Database Export

The `database-export` folder contains JSON exports of the MongoDB collections used by the application:

- users.json
- flashcards.json
- learninghistories.json

These files can be imported back into MongoDB to recreate the application's data.

## Workload Allocation

completed individually:

| Member | Work Completed |
|---|---|
| Rei Jiang Wong | Full-stack development, React frontend, Express backend, MongoDB models, JWT authentication, flashcard CRUD, learning history, admin panel, README, database export |




## Security Practices

- Passwords are hashed using bcryptjs before being stored.
- JWT tokens are used to protect private routes.
- Admin-only routes use role-based access control.
- Sensitive credentials are stored in `.env` and excluded by `.gitignore`.
- Frontend requests use bearer tokens in the Authorization header.

## Known Limitations

- The admin test shortcut assigns admin role when an email contains `admin`. This is useful for assignment demonstration. In a real production system, admin accounts should be created through a secure internal process.
- The project does not include email verification.
- The project is designed for localhost demonstration unless deployed separately.

## Future Improvements

- Add charts for learning progress
- Add spaced repetition scheduling
- Add password reset
- Add stricter admin creation workflow
- Deploy frontend and backend online
- Add automated tests


