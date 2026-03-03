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
            'answers' => 'required|array',
            'time_taken' => 'required|integer|min:1|max:7200',
            'hints_used' => 'integer|min:0|max:2'
        ]);

        $user = $request->user();
        $puzzle = Puzzle::findOrFail($request->puzzle_id);

        // Verify answers match puzzle words
        $isValid = $this->verifyAnswers($puzzle, $request->answers);
        if (!$isValid) {
            return response()->json(['message' => 'Invalid puzzle answers'], 400);
        }

        // Check reasonable time (min 3 seconds per word)
        $minTime = count($puzzle->words) * 3;
        if ($request->time_taken < $minTime) {
            return response()->json(['message' => 'Completion time too fast - suspicious activity detected'], 400);
        }

        // Check hints limit (max 2 per level)
        $hintsUsed = $request->hints_used ?? 0;
        if ($hintsUsed > 2) {
            return response()->json(['message' => 'Maximum 2 hints allowed per level'], 400);
        }

        // GenZ Scoring Logic
        $baseScore = 100;
        $penalty = $hintsUsed * 10;
        $timeBonus = $request->time_taken < 30 ? 20 : 0;

        $finalScore = max(10, $baseScore - $penalty + $timeBonus);

        // Star Logic
        $stars = 3;
        if ($hintsUsed > 0)
            $stars = 2;
        if ($hintsUsed > 1)
            $stars = 1;

        // Update Score (upsert)
        Score::updateOrCreate(
            ['user_id' => $user->id, 'puzzle_id' => $puzzle->id],
            ['score' => $finalScore, 'stars' => $stars, 'time_taken' => $request->time_taken]
        );

        // Mark Progress and save hints used
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'puzzle_id' => $puzzle->id],
            ['is_completed' => true, 'hints_used' => $hintsUsed]
        );

        return response()->json([
            'score' => $finalScore,
            'stars' => $stars,
            'message' => 'Puzzle cleared! No cap. 🔥'
        ]);
    }

    private function verifyAnswers($puzzle, $answers)
    {
        // Extract all words from puzzle
        $expectedWords = collect($puzzle->words)->pluck('word')->map(function($word) {
            return strtoupper($word);
        })->sort()->values();

        // Process submitted answers
        $submittedWords = collect($answers)->map(function($word) {
            return strtoupper(trim($word));
        })->sort()->values();

        // Check if all words match
        return $expectedWords->count() === $submittedWords->count() && 
               $expectedWords->every(function($word, $index) use ($submittedWords) {
                   return $word === $submittedWords[$index];
               });
    }

    public function getHintStatus(Request $request, $puzzleId)
    {
        $user = $request->user();
        
        $progress = UserProgress::where('user_id', $user->id)
            ->where('puzzle_id', $puzzleId)
            ->first();
        
        $hintsUsed = $progress ? $progress->hints_used : 0;
        $hintsRemaining = max(0, 2 - $hintsUsed);
        
        return response()->json([
            'hints_used' => $hintsUsed,
            'hints_remaining' => $hintsRemaining,
            'max_hints' => 2
        ]);
    }

    public function useHint(Request $request)
    {
        $request->validate([
            'puzzle_id' => 'required|exists:puzzles,id'
        ]);

        $user = $request->user();
        $puzzleId = $request->puzzle_id;

        $progress = UserProgress::where('user_id', $user->id)
            ->where('puzzle_id', $puzzleId)
            ->first();

        $hintsUsed = $progress ? $progress->hints_used : 0;

        if ($hintsUsed >= 2) {
            return response()->json(['message' => 'Maximum hints reached (2/2)'], 400);
        }

        // Increment hints
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'puzzle_id' => $puzzleId],
            ['hints_used' => $hintsUsed + 1]
        );

        return response()->json([
            'hints_used' => $hintsUsed + 1,
            'hints_remaining' => 1 - $hintsUsed,
            'message' => 'Hint used successfully'
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
