<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Puzzle extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'words' => 'array',
        'grid' => 'array',
    ];
}
