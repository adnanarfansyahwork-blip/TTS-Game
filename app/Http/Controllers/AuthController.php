<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => 'player',
        ]);

        $token = $user->createToken('player-token')->plainTextToken;
        return response()->json(['token' => $token, 'user' => $user, 'role' => 'player']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            $tokenName = $user->role === 'admin' ? 'admin-token' : 'player-token';
            $token = $user->createToken($tokenName)->plainTextToken;
            return response()->json([
                'token' => $token,
                'user' => $user,
                'role' => $user->role ?? 'player'
            ]);
        }

        return response()->json(['message' => 'Email atau Password salah'], 401);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
