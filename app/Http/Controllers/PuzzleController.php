<?php

namespace App\Http\Controllers;

use App\Models\Puzzle;
use Illuminate\Http\Request;

class PuzzleController extends Controller
{
    public function index(Request $request)
    {
        $puzzles = Puzzle::select('id', 'title', 'level', 'created_at')
            ->orderBy('level', 'asc')
            ->get();

        $user = auth('sanctum')->user();
        if ($user) {
            $scores = \App\Models\Score::where('user_id', $user->id)->get()->keyBy('puzzle_id');
            $puzzles->each(function ($p) use ($scores) {
                $p->stars = isset($scores[$p->id]) ? $scores[$p->id]->stars : 0;
                $p->is_completed = isset($scores[$p->id]);
            });
        }

        return $puzzles;
    }

    public function show($id)
    {
        $puzzle = Puzzle::findOrFail($id);
        return response()->json($puzzle);
    }

    public function showByLevel($level)
    {
        $puzzle = Puzzle::where('level', $level)->where('is_published', true)->firstOrFail();
        return response()->json($puzzle);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'level' => 'required|integer|unique:puzzles,level',
            'words' => 'required|array',
            'grid' => 'required|array',
        ]);

        $puzzle = Puzzle::create($validated);

        return response()->json($puzzle, 201);
    }
}
