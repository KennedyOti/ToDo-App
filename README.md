# ToDo App - Fullstack Laravel + Next.js Guide

This is a complete fullstack ToDo application built with:
- **Backend**: Laravel (REST API with Sanctum for authentication)
- **Frontend**: Next.js 14 (React framework)

This guide explains **how everything works together** so you can build bigger projects.

---

## 📁 Project Structure Overview

```
ToDo-App/
├── backend/          # Laravel REST API
│   ├── app/          # Core application code
│   ├── routes/       # API endpoints definition
│   ├── config/       # Configuration files
│   ├── database/     # Migrations, models
│   └── ...
├── frontend/         # Next.js Frontend
│   ├── app/          # Pages and routes
│   ├── lib/          # API helper functions
│   ├── public/       # Static assets
│   └── ...
└── README.md         # This file
```

---

# 🔧 BACKEND: Laravel REST API

The backend provides a REST API that the frontend communicates with.

## Backend Folder Structure Explained

```
backend/
├── app/                    # YOUR APPLICATION CODE
│   ├── Http/
│   │   └── Controllers/   # Handle HTTP requests (the "C" in MVC)
│   │       ├── AuthController.php    # Login/Register/Logout logic
│   │       └── TodoController.php      # CRUD operations for todos
│   ├── Models/             # Database table representations
│   │   ├── Todo.php        # Represents the todos table
│   │   └── User.php        # Represents the users table
│   └── Providers/          # Service providers (app setup)
├── routes/
│   └── api.php             # ALL API ENDPOINTS ARE HERE
├── config/                  # Configuration files (database, cors, etc.)
├── database/
│   ├── migrations/          # Database table schemas
│   └── seeders/            # Sample data
└── .env                     # Environment variables (API keys, DB credentials)
```

---

## Key Backend Concepts

### 1. **Routes (routes/api.php)** - Where You Define API Endpoints

Routes are URLs that the frontend can call. Think of them as "addresses" for your API.

```php
// backend/routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TodoController;

// POST /api/register → AuthController's register method
Route::post('/register', [AuthController::class, 'register']);

// POST /api/login → AuthController's login method  
Route::post('/login', [AuthController::class, 'login']);

// Routes protected by authentication (need valid token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('todos', TodoController::class);  // CRUD for todos
});
```

**Common HTTP Methods:**
| Method | Description | Example |
|--------|-------------|---------|
| `GET` | Retrieve data | `GET /api/todos` - Get all todos |
| `POST` | Create new data | `POST /api/todos` - Create a todo |
| `PUT` | Update existing | `PUT /api/todos/1` - Update todo #1 |
| `DELETE` | Remove data | `DELETE /api/todos/1` - Delete todo #1 |

### 2. **Controllers (app/Http/Controllers/)** - Request Handlers

Controllers contain the logic for handling each API request.

```php
// backend/app/Http/Controllers/TodoController.php

class TodoController extends Controller
{
    // GET /api/todos
    public function index(Request $request) {
        // Get the authenticated user
        $user = $request->user();
        // Return their todos as JSON
        return response()->json(['data' => $user->todos->toArray()]);
    }

    // POST /api/todos
    public function store(Request $request) {
        // Validate incoming data
        $validated = $request->validate(['title' => 'required|string']);
        // Create todo linked to authenticated user
        $todo = $request->user()->todos()->create($validated);
        return response()->json(['data' => $todo], 201); // 201 = Created
    }
}
```

### 3. **Models (app/Models/)** - Database Tables as Objects

Models represent database tables and let you interact with them using object-oriented code.

```php
// backend/app/Models/Todo.php

class Todo extends Model
{
    // Which fields can be mass-assigned
    protected $fillable = ['title', 'completed', 'user_id'];
    
    // Define relationship: A todo belongs to a user
    public function user() {
        return $this->belongsTo(User::class);
    }
}
```

**Usage Example:**
```php
// Get all todos
Todo::all();

// Create a new todo
Todo::create(['title' => 'Learn Laravel', 'completed' => false]);

// Find by ID
Todo::find(1);

// Get todos for a specific user
$user->todos()->get();
```

### 4. **Database Migrations** - Version Control for Database Schema

Migrations define your database tables in code (not SQL).

```php
// backend/database/migrations/2026_02_05_103118_create_todos_table.php

public function up()
{
    Schema::create('todos', function (Blueprint $table) {
        $table->id();                    // Auto-increment ID
        $table->foreignId('user_id')->constrained(); // Links to users table
        $table->string('title');         // VARCHAR column
        $table->boolean('completed')->default(false); // Boolean, default false
        $table->timestamps();            // created_at and updated_at
    });
}
```

---

# 🎨 FRONTEND: Next.js

The frontend is a React application that displays the UI and communicates with the Laravel API.

## Frontend Folder Structure Explained

```
frontend/
├── app/                    # Next.js App Router (pages)
│   ├── page.tsx            # Home page
│   ├── login/
│   │   └── page.js         # Login page
│   ├── register/
│   │   └── page.js         # Registration page
│   └── todos/
│       └── page.js         # Main todo dashboard (protected)
├── lib/                    # Helper functions for API calls
│   ├── api.js              # Axios instance with base URL and interceptors
│   ├── auth.js             # Authentication API functions
│   └── todo.js             # Todo CRUD API functions
├── public/                 # Static files (images, icons)
└── .env.local              # Frontend environment variables
```

---

## How Frontend Communicates with Backend

### The Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User clicks "Login"                                              │
│        ↓                                                         │
│  lib/auth.js calls API                                           │
│        ↓                                                         │
│  lib/api.js sends HTTP request to backend                       │
│        ↓                                                         │
│  Backend processes request                                       │
│        ↓                                                         │
│  Backend returns JSON response                                  │
│        ↓                                                         │
│  Frontend updates UI based on response                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Login Flow

1. **User enters credentials** in the login form
2. **Frontend requests CSRF cookie** from Laravel Sanctum
3. **Frontend sends POST request** to `/api/login`
4. **Backend validates** email and password
5. **Backend returns a token** (Bearer token authentication)
6. **Frontend stores token** in localStorage
7. **Frontend redirects** to `/todos` page

### Step-by-Step: Fetching Todos

1. **Page loads** → Check if user has a token
2. **Request CSRF cookie** (required for Sanctum)
3. **Call GET `/api/todos`** with the token in headers
4. **Backend verifies token** and returns user's todos
5. **Frontend displays todos** in a table

---

## Key Frontend Files Explained

### 1. **lib/api.js** - The API Client Configuration

This file sets up axios (HTTP client) with the base URL and automatic token injection.

```javascript
// frontend/lib/api.js
import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,  // http://localhost:8000/api
  withCredentials: true,                      // Include cookies in requests
  headers: {
    "Accept": "application/json",
  },
});

// INTERCEPTOR: Automatically add token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
```

**Why use interceptors?**
- You don't need to manually add the token to every API call
- The interceptor automatically attaches it before each request

### 2. **lib/todo.js** - Todo API Functions

These are wrapper functions that call the API using the configured axios instance.

```javascript
// frontend/lib/todo.js
import api from "./api";

export const fetchTodos = () => api.get("/todos");
export const createTodo = (todo) => api.post("/todos", todo);
export const updateTodo = (id, todo) => api.put(`/todos/${id}`, todo);
export const deleteTodo = (id) => api.delete(`/todos/${id}`);
```

**Usage in a component:**
```javascript
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "@/lib/todo";

// Get all todos
const todos = await fetchTodos();

// Create a new todo
await createTodo({ title: "Learn React" });

// Update a todo
await updateTodo(1, { title: "Updated title", completed: true });

// Delete a todo
await deleteTodo(1);
```

### 3. **app/todos/page.js** - The Main Todo Dashboard

This is a React component that displays and manages todos.

```javascript
// frontend/app/todos/page.js
"use client";  // This is a client-side component (has interactivity)

import { useState, useEffect } from "react";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "@/lib/todo";
import { useRouter } from "next/navigation";

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState([]);  // State to hold todos
  const [newTodo, setNewTodo] = useState("");

  // useEffect runs when page loads
  useEffect(() => {
    const loadTodos = async () => {
      const res = await fetchTodos();
      setTodos(res.data.data);  // Update state with todos from API
    };
    loadTodos();
  }, []);

  // Function to add a new todo
  const addTodo = async (e) => {
    e.preventDefault();
    const res = await createTodo({ title: newTodo });
    setTodos([...todos, res.data.data]);  // Add new todo to state
    setNewTodo("");
  };

  // Function to delete a todo
  const handleDelete = async (id) => {
    await deleteTodo(id);
    setTodos(todos.filter(todo => todo.id !== id));  // Remove from state
  };

  return (
    <div>
      <h1>My Tasks</h1>
      <form onSubmit={addTodo}>
        <input 
          value={newTodo} 
          onChange={(e) => setNewTodo(e.target.value)} 
        />
        <button type="submit">Add Task</button>
      </form>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.title}
            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**React Concepts Explained:**
| Concept | Description |
|---------|-------------|
| `useState` | Stores data that changes over time (like todos list) |
| `useEffect` | Runs code when component loads (fetch data on mount) |
| `useRouter` | Programmatic navigation (redirect user) |
| `onChange` | Updates state when user types in input |
| `onSubmit` | Handles form submission |

---

## Environment Variables

### Backend (.env)
```
backend/.env
APP_URL=http://localhost:8000          # Laravel app URL
DB_CONNECTION=mysql                      # Database type
DB_HOST=127.0.0.1                        # Database server
DB_DATABASE=backend                      # Database name

# Laravel Sanctum (for API authentication)
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### Frontend (.env.local)
```
frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Important:** `NEXT_PUBLIC_` prefix makes the variable accessible in browser code.

---

## CORS (Cross-Origin Resource Sharing)

CORS allows the frontend (running on port 3000) to communicate with the backend (running on port 8000).

```php
// backend/config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000'],  // Frontend URL
    'supports_credentials' => true,  // Allow cookies
];
```

---

## Authentication Flow with Laravel Sanctum

```
1. LOGIN
   Frontend: POST /api/login {email, password}
   Backend:  Returns {token: "abc123", user: {...}}
   Frontend: Stores token in localStorage

2. SUBSEQUENT REQUESTS
   Frontend: GET /api/todos
             Headers: Authorization: Bearer abc123
   Backend:  Verifies token, returns user's todos

3. LOGOUT
   Frontend: POST /api/logout
   Backend:  Deletes all user's tokens
   Frontend: Removes token from localStorage
```

---

## Quick Reference: Backend Routes

| Method | URL | Controller Method | Description |
|--------|-----|-------------------|-------------|
| POST | `/api/register` | `AuthController@register` | Create new user |
| POST | `/api/login` | `AuthController@login` | User login |
| POST | `/api/logout` | `AuthController@logout` | User logout |
| GET | `/api/todos` | `TodoController@index` | Get all todos |
| POST | `/api/todos` | `TodoController@store` | Create todo |
| PUT | `/api/todos/{id}` | `TodoController@update` | Update todo |
| DELETE | `/api/todos/{id}` | `TodoController@destroy` | Delete todo |

---

## Key Takeaways for Your Next Project

### 1. **Backend Structure**
- Routes define URLs → Controllers handle requests → Models interact with database
- Controllers should be thin (just validation + model calls)
- Keep business logic in models or service classes

### 2. **Frontend Structure**
- Use `lib/` for API calls to keep components clean
- Components should be focused on UI, not HTTP logic
- Use React hooks (`useState`, `useEffect`) for state management

### 3. **Communication Pattern**
```
Frontend (Browser)                          Backend (Server)
     |                                            |
     |-- HTTP Request (JSON) -->                 |
     |                                            |-- Process
     |                                            |-- Database Query
     |<-- HTTP Response (JSON) ---               |
     |                                            |
```

### 4. **Authentication Best Practice**
- Always validate CSRF on stateful requests
- Use Bearer tokens for API authentication
- Store tokens securely (localStorage is okay for learning, consider httpOnly cookies for production)

---

## Running the Project

### Start Backend (Laravel)
```bash
cd backend
cp .env.example .env
php artisan migrate
php artisan serve
# Backend runs on http://localhost:8000
```

### Start Frontend (Next.js)
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

---

This architecture is scalable and follows industry best practices. Use this as a template for your next bigger project!
