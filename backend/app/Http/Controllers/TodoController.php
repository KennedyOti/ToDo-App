<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;
use Illuminate\Support\Facades\Auth;

class TodoController extends Controller
{
    public function index(Request $request) {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        return response()->json(['data' => $user->todos->toArray()]);
    }

    public function store(Request $request) {
        $validated = $request->validate(['title'=>'required|string']);
        $todo = $request->user()->todos()->create($validated);
        return response()->json(['data' => $todo], 201);
    }

    public function update(Request $request, Todo $todo) {
        // Ensure user owns this todo
        if ($todo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $todo->update($request->only('title','completed'));
        return response()->json(['data' => $todo]);
    }

    public function destroy(Request $request, Todo $todo) {
        // Ensure user owns this todo
        if ($todo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $todo->delete();
        return response()->noContent();
    }

}
