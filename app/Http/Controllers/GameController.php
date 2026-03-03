<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Puzzle;
use App\Models\Score;
use App\Models\UserProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GameController extends Controller
{
    public function submitResult(Request $request)
    {
        $request->validate([
            'puzzle_id' => 'required|exists:puzzles,id',
            'time_taken' => 'required|integer',
            'hints_used' => 'integer'
        ]);

        $user = $request->user();
        $puzzle = Puzzle::findOrFail($request->puzzle_id);

        // GenZ Scoring Logic
        $baseScore = 100;
        $penalty = ($request->hints_used ?? 0) * 10;
        $timeBonus = $request->time_taken < 30 ? 20 : 0;

        $finalScore = max(10, $baseScore - $penalty + $timeBonus);

        // Star Logic
        $stars = 3;
        if ($request->hints_used > 0)
            $stars = 2;
        if ($request->hints_used > 2)
            $stars = 1;

        // Update Score (upsert)
        Score::updateOrCreate(
            ['user_id' => $user->id, 'puzzle_id' => $puzzle->id],
            ['score' => $finalScore, 'stars' => $stars, 'time_taken' => $request->time_taken]
        );

        // Mark Progress
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'puzzle_id' => $puzzle->id],
            ['is_completed' => true]
        );

        return response()->json([
            'score' => $finalScore,
            'stars' => $stars,
            'message' => 'Puzzle cleared! No cap. 🔥'
        ]);
    }

    public function getLeaderboard()
    {
        return User::select('name')
            ->join('scores', 'users.id', '=', 'scores.user_id')
            ->selectRaw('users.name, SUM(scores.score) as total_score, SUM(scores.stars) as total_stars')
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_score', 'desc')
            ->limit(10)
            ->get();
    }

    public function getUserStats(Request $request)
    {
        $user = $request->user();
        $completedCount = UserProgress::where('user_id', $user->id)->where('is_completed', true)->count();
        $totalScore = Score::where('user_id', $user->id)->sum('score');

        return response()->json([
            'completed' => $completedCount,
            'total_score' => $totalScore
        ]);
    }
}
