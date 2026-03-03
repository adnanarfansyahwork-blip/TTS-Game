import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post('/api/login', { email, password });
            if (res.data.token) {
                // Store auth token for all users
                localStorage.setItem('auth_token', res.data.token);
                localStorage.setItem('user_name', res.data.user.name);
                localStorage.setItem('user_role', res.data.role || res.data.user.role || 'player');

                // Only store admin_token if user is actually admin
                if (res.data.role === 'admin' || res.data.user.role === 'admin') {
                    localStorage.setItem('admin_token', res.data.token);
                    navigate('/admin');
                } else {
                    // Remove any stale admin_token
                    localStorage.removeItem('admin_token');
                    navigate('/');
                }
            }
        } catch (err) {
            setError('Login gagal. Cek email & password kamu ya!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-bg-sky"></div>
                <div className="auth-bg-sun"></div>
                <div className="auth-bg-cloud ac1"></div>
                <div className="auth-bg-cloud ac2"></div>
                <div className="auth-bg-meadow"></div>
                <div className="auth-bg-grass"></div>
            </div>

            <div className="auth-container">
                <Link to="/" className="auth-back">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </Link>

                <div className="auth-card">
                    <div className="auth-icon">🔑</div>
                    <h1 className="auth-title">Masuk</h1>
                    <p className="auth-subtitle">Selamat datang kembali!</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="auth-field">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="email@contoh.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="auth-submit">
                            {loading ? 'Memproses...' : 'Masuk 🚀'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Belum punya akun? <Link to="/register">Daftar di sini</Link>
                    </p>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
                .auth-page { position: fixed; inset: 0; font-family: 'Nunito', sans-serif; overflow-y: auto; }
                .auth-bg { position: fixed; inset: 0; z-index: 0; }
                .auth-bg-sky { position: absolute; inset: 0; background: linear-gradient(180deg, #5BA3D9 0%, #7EC8E3 30%, #ADE4C0 55%, #8BBF6A 75%, #5A9E3E 90%, #3D7A28 100%); }
                .auth-bg-sun { position: absolute; top: 5%; right: 12%; width: 90px; height: 90px; background: radial-gradient(circle, rgba(255,250,200,0.9) 0%, rgba(255,220,100,0.4) 40%, transparent 65%); border-radius: 50%; }
                .auth-bg-cloud { position: absolute; background: rgba(255,255,255,0.45); border-radius: 100px; filter: blur(2px); }
                .ac1 { top: 8%; left: 5%; width: 100px; height: 26px; animation: aDrift 32s linear infinite; }
                .ac2 { top: 15%; right: 8%; width: 70px; height: 20px; animation: aDrift 40s linear infinite reverse; }
                .auth-bg-meadow { position: absolute; bottom: 0; left: 0; right: 0; height: 50%; background: linear-gradient(180deg, transparent 0%, rgba(90,130,50,0.5) 35%, rgba(70,115,40,0.85) 100%); }
                .auth-bg-grass { position: absolute; bottom: 0; left: 0; right: 0; height: 25%; background: linear-gradient(180deg, rgba(60,110,40,0.8) 0%, rgba(40,85,25,1) 100%); }
                @keyframes aDrift { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }

                .auth-container { position: relative; z-index: 1; max-width: 380px; margin: 0 auto; padding: 20px 16px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; box-sizing: border-box; }
                .auth-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.8); text-decoration: none; font-weight: 700; font-size: 0.8rem; margin-bottom: 16px; transition: color 0.2s; }
                .auth-back:hover { color: #fff; }
                .auth-card { background: rgba(255,255,255,0.92); backdrop-filter: blur(15px); border-radius: 24px; padding: 32px 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.15); border: 2px solid rgba(255,255,255,0.95); animation: aCardIn 0.4s ease-out; }
                .auth-icon { text-align: center; font-size: 2.5rem; margin-bottom: 4px; }
                .auth-title { text-align: center; font-weight: 900; font-size: 1.6rem; color: #2D3748; margin: 0 0 2px; }
                .auth-subtitle { text-align: center; color: #718096; font-size: 0.8rem; font-weight: 600; margin: 0 0 24px; }
                .auth-error { background: #FEF2F2; color: #DC2626; border: 1.5px solid #FECACA; padding: 10px 14px; border-radius: 12px; font-weight: 700; font-size: 0.78rem; margin-bottom: 16px; text-align: center; }
                .auth-field { margin-bottom: 16px; }
                .auth-field label { display: block; font-weight: 800; font-size: 0.75rem; color: #4A5568; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                .auth-field input { width: 100%; padding: 12px 16px; border-radius: 14px; border: 2px solid #E2E8F0; background: #F7FAFC; font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; box-sizing: border-box; outline: none; }
                .auth-field input:focus { border-color: #3B82F6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
                .auth-submit { width: 100%; padding: 14px; background: linear-gradient(135deg, #3B82F6, #2563EB); border-radius: 14px; border: none; color: #fff; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.35), 0 3px 0 #1D4ED8; transition: all 0.2s; margin-top: 4px; }
                .auth-submit:hover { transform: translateY(-2px); }
                .auth-submit:active { transform: translateY(1px); box-shadow: 0 1px 4px rgba(59,130,246,0.3), 0 1px 0 #1D4ED8; }
                .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                .auth-switch { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #718096; font-weight: 600; }
                .auth-switch a { color: #3B82F6; font-weight: 800; text-decoration: none; }
                .auth-switch a:hover { text-decoration: underline; }
                @keyframes aCardIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
