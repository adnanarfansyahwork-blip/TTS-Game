<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PuzzleController;
use App\Http\Controllers\GameController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::get('/puzzles', [PuzzleController::class, 'index']);
Route::get('/puzzles/{id}', [PuzzleController::class, 'show']);
Route::get('/puzzles/level/{level}', [PuzzleController::class, 'showByLevel']);

Route::get('/leaderboard', [GameController::class, 'getLeaderboard']);

// Authenticated routes (any logged-in user)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/submit-result', [GameController::class, 'submitResult']);
    Route::get('/user-stats', [GameController::class, 'getUserStats']);

    // Check if current user is admin
    Route::get('/check-admin', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'is_admin' => $user->role === 'admin',
            'role' => $user->role ?? 'player'
        ]);
    });
});

// Admin-only routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/puzzles', function (Request $request) {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        return app(PuzzleController::class)->store($request);
    });
});
