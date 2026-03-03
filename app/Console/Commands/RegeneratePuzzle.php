<?php

namespace App\Console\Commands;

use App\Models\Puzzle;
use Illuminate\Console\Command;

class RegeneratePuzzle extends Command
{
    protected $signature = 'puzzle:regenerate {level}';
    protected $description = 'Regenerate puzzle grid data for a given level using the words already stored';

    public function handle()
    {
        $level = $this->argument('level');
        $puzzle = Puzzle::where('level', $level)->first();

        if (!$puzzle) {
            $this->error("Puzzle level {$level} not found");
            return 1;
        }

        $words = $puzzle->words;
        $this->info("Found puzzle: {$puzzle->title} with " . count($words) . " words");

        foreach ($words as $w) {
            $this->line("  - {$w['word']} ({$w['direction']}) clue: {$w['clue']}");
        }

        // Regenerate the grid properly
        $items = collect($words)->map(fn($w) => [
            'word' => strtoupper($w['word']),
            'clue' => $w['clue'],
        ])->values()->toArray();

        // Simple crossword generation in PHP
        $result = $this->generateCrossword($items);

        if (!$result) {
            $this->error("Failed to generate crossword!");
            return 1;
        }

        $this->info("\nNew grid ({$result['width']}x{$result['height']}):");
        foreach ($result['grid'] as $y => $row) {
            $line = '';
            foreach ($row as $cell) {
                $line .= $cell ? $cell['letter'] : '.';
            }
            $this->line("  " . $line);
        }

        // Verify intersections
        $this->info("\nIntersection check:");
        foreach ($result['grid'] as $y => $row) {
            foreach ($row as $x => $cell) {
                if ($cell && count($cell['belongsTo']) > 1) {
                    $info = [];
                    foreach ($cell['belongsTo'] as $b) {
                        $w = collect($result['words'])->firstWhere('id', $b['id']);
                        $info[] = "{$w['word']}[{$b['index']}]={$w['word'][$b['index']]}";
                    }
                    $this->line("  ({$x},{$y}) letter='{$cell['letter']}': " . implode(' x ', $info));
                }
            }
        }

        if ($this->confirm('Update puzzle in database?', true)) {
            $puzzle->update([
                'grid' => $result['grid'],
                'words' => $result['words'],
            ]);
            $this->info("Puzzle updated successfully!");
        }

        return 0;
    }

    private function generateCrossword(array $items): ?array
    {
        $words = [];
        foreach ($items as $i => $item) {
            $words[] = [
                'id' => $i + 1,
                'word' => strtoupper(str_replace(' ', '', $item['word'])),
                'clue' => $item['clue'],
                'placed' => false,
                'x' => 0,
                'y' => 0,
                'direction' => null,
            ];
        }

        // Sort by length (longest first)
        usort($words, fn($a, $b) => strlen($b['word']) - strlen($a['word']));

        $grid = []; // Sparse grid: "x,y" => ['letter' => 'A', 'wordIds' => [1,2]]

        // Place first word
        $words[0]['x'] = 0;
        $words[0]['y'] = 0;
        $words[0]['direction'] = 'across';
        $words[0]['placed'] = true;
        $this->placeWord($grid, $words[0]);

        // Place remaining words
        for ($i = 1; $i < count($words); $i++) {
            $candidate = &$words[$i];
            $bestPlacement = null;
            $bestScore = -1;

            foreach ($words as $placed) {
                if (!$placed['placed'])
                    continue;

                for ($ci = 0; $ci < strlen($candidate['word']); $ci++) {
                    for ($pi = 0; $pi < strlen($placed['word']); $pi++) {
                        if ($candidate['word'][$ci] !== $placed['word'][$pi])
                            continue;

                        $newDir = $placed['direction'] === 'across' ? 'down' : 'across';

                        if ($placed['direction'] === 'across') {
                            $startX = $placed['x'] + $pi;
                            $startY = $placed['y'] - $ci;
                        } else {
                            $startX = $placed['x'] - $ci;
                            $startY = $placed['y'] + $pi;
                        }

                        if ($this->isValidPlacement($grid, $candidate['word'], $startX, $startY, $newDir)) {
                            $score = 100 - abs($startX) - abs($startY);
                            if ($score > $bestScore) {
                                $bestScore = $score;
                                $bestPlacement = ['x' => $startX, 'y' => $startY, 'direction' => $newDir];
                            }
                        }
                    }
                }
            }

            if ($bestPlacement) {
                $candidate['x'] = $bestPlacement['x'];
                $candidate['y'] = $bestPlacement['y'];
                $candidate['direction'] = $bestPlacement['direction'];
                $candidate['placed'] = true;
                $this->placeWord($grid, $candidate);
            }
        }

        $placedWords = array_values(array_filter($words, fn($w) => $w['placed']));
        if (empty($placedWords))
            return null;

        // Find bounding box
        $minX = PHP_INT_MAX;
        $minY = PHP_INT_MAX;
        $maxX = PHP_INT_MIN;
        $maxY = PHP_INT_MIN;
        foreach ($placedWords as $w) {
            $endX = $w['direction'] === 'across' ? $w['x'] + strlen($w['word']) - 1 : $w['x'];
            $endY = $w['direction'] === 'down' ? $w['y'] + strlen($w['word']) - 1 : $w['y'];
            $minX = min($minX, $w['x']);
            $minY = min($minY, $w['y']);
            $maxX = max($maxX, $endX);
            $maxY = max($maxY, $endY);
        }

        $width = $maxX - $minX + 1;
        $height = $maxY - $minY + 1;

        // Normalize and assign numbers
        foreach ($placedWords as &$w) {
            $w['nx'] = $w['x'] - $minX;
            $w['ny'] = $w['y'] - $minY;
        }
        unset($w);

        $sequence = 1;
        $starts = [];
        foreach ($placedWords as &$w) {
            $k = $w['ny'] * 1000 + $w['nx'];
            $starts[$k][] = &$w;
        }
        unset($w);
        ksort($starts);
        foreach ($starts as &$group) {
            foreach ($group as &$w) {
                $w['number'] = $sequence;
            }
            $sequence++;
        }
        unset($w, $group);

        // Build final 2D grid
        $finalGrid = array_fill(0, $height, array_fill(0, $width, null));

        foreach ($placedWords as $w) {
            for ($i = 0; $i < strlen($w['word']); $i++) {
                $cx = $w['direction'] === 'across' ? $w['nx'] + $i : $w['nx'];
                $cy = $w['direction'] === 'down' ? $w['ny'] + $i : $w['ny'];

                if (!$finalGrid[$cy][$cx]) {
                    $finalGrid[$cy][$cx] = [
                        'letter' => $w['word'][$i],
                        'isStart' => false,
                        'startLabel' => null,
                        'belongsTo' => [],
                    ];
                }

                $finalGrid[$cy][$cx]['belongsTo'][] = [
                    'id' => $w['id'],
                    'dir' => $w['direction'],
                    'index' => $i,
                ];

                if ($i === 0) {
                    $finalGrid[$cy][$cx]['isStart'] = true;
                    $finalGrid[$cy][$cx]['startLabel'] = $w['number'];
                }
            }
        }

        // Build clean word list for storage
        $wordList = [];
        foreach ($placedWords as $w) {
            $wordList[] = [
                'id' => $w['id'],
                'word' => $w['word'],
                'clue' => $w['clue'],
                'direction' => $w['direction'],
                'number' => $w['number'],
                'nx' => $w['nx'],
                'ny' => $w['ny'],
            ];
        }

        return [
            'grid' => $finalGrid,
            'width' => $width,
            'height' => $height,
            'words' => $wordList,
        ];
    }

    private function placeWord(array &$grid, array $wordObj): void
    {
        for ($i = 0; $i < strlen($wordObj['word']); $i++) {
            $cx = $wordObj['direction'] === 'across' ? $wordObj['x'] + $i : $wordObj['x'];
            $cy = $wordObj['direction'] === 'down' ? $wordObj['y'] + $i : $wordObj['y'];
            $key = "{$cx},{$cy}";
            if (!isset($grid[$key])) {
                $grid[$key] = ['letter' => $wordObj['word'][$i], 'wordIds' => [$wordObj['id']]];
            } else {
                $grid[$key]['wordIds'][] = $wordObj['id'];
            }
        }
    }

    private function isValidPlacement(array $grid, string $word, int $x, int $y, string $dir): bool
    {
        for ($i = 0; $i < strlen($word); $i++) {
            $cx = $dir === 'across' ? $x + $i : $x;
            $cy = $dir === 'down' ? $y + $i : $y;
            $key = "{$cx},{$cy}";

            if (isset($grid[$key]) && $grid[$key]['letter'] !== $word[$i]) {
                return false;
            }

            if (!isset($grid[$key])) {
                if ($dir === 'across') {
                    if (isset($grid["{$cx}," . ($cy - 1)]))
                        return false;
                    if (isset($grid["{$cx}," . ($cy + 1)]))
                        return false;
                    if ($i === 0 && isset($grid[($cx - 1) . ",{$cy}"]))
                        return false;
                    if ($i === strlen($word) - 1 && isset($grid[($cx + 1) . ",{$cy}"]))
                        return false;
                } else {
                    if (isset($grid[($cx - 1) . ",{$cy}"]))
                        return false;
                    if (isset($grid[($cx + 1) . ",{$cy}"]))
                        return false;
                    if ($i === 0 && isset($grid["{$cx}," . ($cy - 1)]))
                        return false;
                    if ($i === strlen($word) - 1 && isset($grid["{$cx}," . ($cy + 1)]))
                        return false;
                }
            }
        }
        return true;
    }
}
