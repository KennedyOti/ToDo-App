"use client";

import { useState, useEffect } from "react";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "@/lib/todo";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000';

export default function TodosPage() {
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  // Initialize CSRF and fetch todos on load
  useEffect(() => {
    const initAndLoad = async () => {
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        // Get CSRF cookie first
        await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
          withCredentials: true
        });
        loadTodos();
      } catch (err) {
        console.error("Failed to initialize CSRF", err);
        router.push("/login");
      }
    };
    initAndLoad();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const res = await fetchTodos();
      setTodos(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch todos", err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) {
      setMessage({ type: "error", text: "Please enter a task title" });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await createTodo({ title: newTodo });
      setNewTodo("");
      setMessage({ type: "success", text: "Task added successfully!" });
      // Immediately add the new todo to the list without waiting for reload
      if (res.data && res.data.data) {
        setTodos((prev) => [...prev, res.data.data]);
      } else {
        loadTodos();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add task. Please try again.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const res = await updateTodo(id, { title: editingTitle });
      setEditingId(null);
      setEditingTitle("");
      setMessage({ type: "success", text: "Task updated successfully!" });
      // Immediately update the todo in the list
      if (res.data && res.data.data) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? res.data.data : todo
          )
        );
      } else {
        loadTodos();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update task" });
    }
  };

  const toggleCompleted = async (todo) => {
    try {
      const res = await updateTodo(todo.id, { completed: !todo.completed });
      // Immediately update the todo status
      if (res.data && res.data.data) {
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todo.id ? res.data.data : t
          )
        );
      } else {
        loadTodos();
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update task status" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id);
      // Immediately remove the todo from the list
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      setMessage({ type: "success", text: "Task deleted successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete task" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  return (
    <div className="todos-container">
      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: "20px" }}>
          {message.text}
        </div>
      )}
      <div className="todos-header">
        <h1>My Tasks</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      <div className="todo-card">
        {/* Create Todo Form */}
        <form onSubmit={addTodo} className="todo-form">
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="What needs to be done?"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                "Add Task"
              )}
            </button>
          </div>
        </form>

        {/* Todo List */}
        {loading ? (
          <div className="loading-container">
            <div className="skeleton-form">
              <div className="d-flex gap-2">
                <div className="skeleton-loader skeleton-form-input"></div>
                <div className="skeleton-loader skeleton-form-btn"></div>
              </div>
            </div>
            <div className="skeleton-header">
              <div className="skeleton-loader skeleton-header-cell"></div>
              <div className="skeleton-loader skeleton-header-cell"></div>
              <div className="skeleton-loader skeleton-header-cell"></div>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="skeleton-row" key={i}>
                <div className="skeleton-loader skeleton-cell title"></div>
                <div className="skeleton-loader skeleton-cell status"></div>
                <div className="skeleton-loader skeleton-cell actions">
                  <div className="skeleton-btn skeleton-loader"></div>
                  <div className="skeleton-btn skeleton-loader"></div>
                  <div className="skeleton-btn skeleton-loader"></div>
                </div>
              </div>
            ))}
            <div className="loading-text">Loading your tasks...</div>
          </div>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <h3>No tasks yet</h3>
            <p>Add your first task above to get started!</p>
          </div>
        ) : (
          <table className="todo-table">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Task</th>
                <th style={{ width: "15%" }}>Status</th>
                <th style={{ width: "35%" }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todos.map((todo) => (
                <tr key={todo.id}>
                  <td>
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                      />
                    ) : (
                      <span className={`todo-title ${todo.completed ? "completed" : ""}`}>
                        {todo.title}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`todo-status ${todo.completed ? "completed" : "pending"}`}>
                      {todo.completed ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons">
                      {editingId === todo.id ? (
                        <>
                          <button
                            className="action-btn save"
                            onClick={() => handleUpdate(todo.id)}
                          >
                            Save
                          </button>
                          <button
                            className="action-btn cancel"
                            onClick={() => {
                              setEditingId(null);
                              setEditingTitle("");
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={`action-btn ${todo.completed ? "undo" : "done"}`}
                            onClick={() => toggleCompleted(todo)}
                          >
                            {todo.completed ? "Undo" : "Done"}
                          </button>
                          <button
                            className="action-btn edit"
                            onClick={() => {
                              setEditingId(todo.id);
                              setEditingTitle(todo.title);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(todo.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
