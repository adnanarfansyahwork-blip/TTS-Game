<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProgress extends Model
{
    protected $table = 'user_progress';
    protected $fillable = ['user_id', 'puzzle_id', 'is_completed', 'hints_used'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function puzzle()
    {
        return $this->belongsTo(Puzzle::class);
    }
}
