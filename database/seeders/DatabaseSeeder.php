<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Puzzle;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin & Test Players
        User::create([
            'name' => 'Admin QuizGenZ',
            'email' => 'admin@admin.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Skyler Pro',
            'email' => 'player@genz.com',
            'password' => bcrypt('password123'),
            'role' => 'player',
        ]);

        // 2. Sample Puzzles (Pre-calculated for stability)

        // LEVEL 1
        Puzzle::create([
            'title' => 'Level Santai: Logic Check',
            'level' => 1,
            'is_published' => true,
            'words' => [
                ['id' => 1, 'number' => 1, 'word' => 'MALAM', 'clue' => 'Setelah sore adalah...', 'direction' => 'down', 'nx' => 0, 'ny' => 0],
                ['id' => 2, 'number' => 2, 'word' => 'ASPAL', 'clue' => 'Ada di pinggir jalan? (Gampang bgt)', 'direction' => 'across', 'nx' => 0, 'ny' => 1],
                ['id' => 3, 'number' => 3, 'word' => 'PINTU', 'clue' => 'Kalo mau masuk rumah lewat?', 'direction' => 'down', 'nx' => 2, 'ny' => 1]
            ],
            'grid' => [
                [['letter' => 'M', 'belongsTo' => [['id' => 1, 'dir' => 'down']], 'isStart' => true, 'startLabel' => 1], null, null, null, null],
                [['letter' => 'A', 'belongsTo' => [['id' => 1, 'dir' => 'down'], ['id' => 2, 'dir' => 'across']], 'isStart' => true, 'startLabel' => 2], ['letter' => 'S', 'belongsTo' => [['id' => 2, 'dir' => 'across']], 'isStart' => false], ['letter' => 'P', 'belongsTo' => [['id' => 2, 'dir' => 'across'], ['id' => 3, 'dir' => 'down']], 'isStart' => true, 'startLabel' => 3], ['letter' => 'A', 'belongsTo' => [['id' => 2, 'dir' => 'across']], 'isStart' => false], ['letter' => 'L', 'belongsTo' => [['id' => 2, 'dir' => 'across']], 'isStart' => false]],
                [['letter' => 'L', 'belongsTo' => [['id' => 1, 'dir' => 'down']], 'isStart' => false], null, ['letter' => 'I', 'belongsTo' => [['id' => 3, 'dir' => 'down']], 'isStart' => false], null, null],
                [['letter' => 'A', 'belongsTo' => [['id' => 1, 'dir' => 'down']], 'isStart' => false], null, ['letter' => 'N', 'belongsTo' => [['id' => 3, 'dir' => 'down']], 'isStart' => false], null, null],
                [['letter' => 'M', 'belongsTo' => [['id' => 1, 'dir' => 'down']], 'isStart' => false], null, ['letter' => 'T', 'belongsTo' => [['id' => 3, 'dir' => 'down']], 'isStart' => false], null, null],
                [null, null, ['letter' => 'U', 'belongsTo' => [['id' => 3, 'dir' => 'down']], 'isStart' => false], null, null]
            ]
        ]);

        // LEVEL 2
        Puzzle::create([
            'title' => 'Level 2: Dapur Absurd',
            'level' => 2,
            'is_published' => true,
            'words' => [
                ['id' => 1, 'number' => 1, 'word' => 'GARAM', 'clue' => 'Bumbu dapur yang asin', 'direction' => 'across', 'nx' => 0, 'ny' => 0],
                ['id' => 2, 'number' => 2, 'word' => 'GULA', 'clue' => 'Bumbu dapur yang manis', 'direction' => 'down', 'nx' => 0, 'ny' => 0],
                ['id' => 3, 'number' => 3, 'word' => 'PULANG', 'clue' => 'Kalau sudah sore anak sekolah harus...', 'direction' => 'across', 'nx' => 0, 'ny' => 3]
            ],
            'grid' => [
                [['letter' => 'G', 'belongsTo' => [['id' => 1, 'dir' => 'across'], ['id' => 2, 'dir' => 'down']], 'isStart' => true, 'startLabel' => 1], ['letter' => 'A', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'R', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'A', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'M', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false]],
                [['letter' => 'U', 'belongsTo' => [['id' => 2, 'dir' => 'down']], 'isStart' => false], null, null, null, null],
                [['letter' => 'L', 'belongsTo' => [['id' => 2, 'dir' => 'down']], 'isStart' => false], null, null, null, null],
                [['letter' => 'A', 'belongsTo' => [['id' => 2, 'dir' => 'down'], ['id' => 3, 'dir' => 'across']], 'isStart' => true, 'startLabel' => 3], ['letter' => 'P', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'U', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'L', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'A', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'N', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'G', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false]],
            ]
        ]);

        // LEVEL 3
        Puzzle::create([
            'title' => 'Level 3: Cak Lontong Vibe',
            'level' => 3,
            'is_published' => true,
            'words' => [
                ['id' => 1, 'number' => 1, 'word' => 'GERBANG', 'clue' => 'Siswa telat masuk sekolah lewat?', 'direction' => 'across', 'nx' => 0, 'ny' => 0],
                ['id' => 2, 'number' => 2, 'word' => 'BOTOL', 'clue' => 'Haus? Minum di...', 'direction' => 'down', 'nx' => 3, 'ny' => 0],
                ['id' => 3, 'number' => 3, 'word' => 'KANTIN', 'clue' => 'Tempat istirahat dan jajan', 'direction' => 'across', 'nx' => 3, 'ny' => 4]
            ],
            'grid' => [
                [['letter' => 'G', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => true, 'startLabel' => 1], ['letter' => 'E', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'R', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'B', 'belongsTo' => [['id' => 1, 'dir' => 'across'], ['id' => 2, 'dir' => 'down']], 'isStart' => true, 'startLabel' => 2], ['letter' => 'A', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'N', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false], ['letter' => 'G', 'belongsTo' => [['id' => 1, 'dir' => 'across']], 'isStart' => false]],
                [null, null, null, ['letter' => 'O', 'belongsTo' => [['id' => 2, 'dir' => 'down']], 'isStart' => false], null, null, null],
                [null, null, null, ['letter' => 'T', 'belongsTo' => [['id' => 2, 'dir' => 'down']], 'isStart' => false], null, null, null],
                [null, null, null, ['letter' => 'O', 'belongsTo' => [['id' => 2, 'dir' => 'down']], 'isStart' => false], null, null, null],
                [null, null, null, ['letter' => 'L', 'belongsTo' => [['id' => 2, 'dir' => 'down'], ['id' => 3, 'dir' => 'across']], 'isStart' => true, 'startLabel' => 3], ['letter' => 'A', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'B', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false], ['letter' => 'A', 'belongsTo' => [['id' => 3, 'dir' => 'across']], 'isStart' => false]],
            ]
        ]);
    }
}
