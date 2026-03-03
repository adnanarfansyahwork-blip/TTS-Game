import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import themeManager from '../lib/theme';

export default function Home() {
    const [puzzles, setPuzzles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(themeManager.isDark());
    const navigate = useNavigate();

    const toggleDarkMode = () => {
        const newState = themeManager.toggle();
        setDarkMode(newState);
    };

    useEffect(() => {
        // Cleanup old localStorage key (migration from old version)
        localStorage.removeItem('completed_levels');

        const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
        if (token) {
            axios.get('/api/user', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('admin_token');
                });
        }

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        axios.get('/api/puzzles', { headers })
            .then(res => {
                setPuzzles(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        window.location.reload();
    };

    // Check completed levels - separate logic for logged-in vs guest users
    let maxUnlockedLevel = 1;
    const isLoggedIn = !!user;

    if (puzzles.length > 0) {
        if (isLoggedIn) {
            // Logged-in users: ONLY use API data from database (ignore localStorage)
            const apiCompleted = puzzles.filter(p => p.is_completed).map(p => p.level);
            if (apiCompleted.length > 0) {
                maxUnlockedLevel = Math.max(...apiCompleted) + 1;
            }
        } else {
            // Guest users: ONLY use guest-specific localStorage
            const guestCompleted = (() => {
                try { return JSON.parse(localStorage.getItem('guest_completed_levels') || '[]'); }
                catch { return []; }
            })();
            if (guestCompleted.length > 0) {
                maxUnlockedLevel = Math.max(...guestCompleted) + 1;
            }
            // Mark puzzles completed from guest localStorage
            puzzles.forEach(p => {
                if (guestCompleted.includes(p.level)) p.is_completed = true;
            });
        }
    }

    return (
        <div className="hp-page">
            {/* ===== NATURE BG ===== */}
            <div className="hp-bg">
                <div className="hp-bg-sky"></div>
                <div className="hp-bg-sun"></div>
                <div className="hp-bg-cloud hp-c1"></div>
                <div className="hp-bg-cloud hp-c2"></div>
                <div className="hp-bg-cloud hp-c3"></div>
                <div className="hp-bg-meadow"></div>
                <div className="hp-bg-grass"></div>
                <div className="hp-particle hp-pp1"></div>
                <div className="hp-particle hp-pp2"></div>
                <div className="hp-particle hp-pp3"></div>
            </div>

            <div className="hp-container">
                {/* ===== HEADER ===== */}
                <header className="hp-header">
                    <div className="hp-logo">
                        <span className="hp-logo-icon">🧩</span>
                        <span className="hp-logo-text">TTS Quest</span>
                    </div>

                    <div className="hp-auth">
                        <button 
                            className="hp-theme-btn" 
                            onClick={toggleDarkMode}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        {user ? (
                            <>
                                <span className="hp-user-name">Hai, {user.name.split(' ')[0]}!</span>
                                {(user.role === 'admin' || localStorage.getItem('user_role') === 'admin') && (
                                    <Link to="/admin" className="hp-auth-btn hp-admin-btn">🛠️</Link>
                                )}
                                <button onClick={handleLogout} className="hp-auth-btn hp-logout-btn">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hp-auth-btn hp-login-btn">Login</Link>
                                <Link to="/register" className="hp-auth-btn hp-join-btn">Daftar</Link>
                            </>
                        )}
                    </div>
                </header>

                {/* ===== RANKING BUTTON ===== */}
                <div className="hp-ranking-row">
                    <Link to="/leaderboard" className="hp-ranking-btn">
                        <span>🏆</span> Ranking Global
                    </Link>
                </div>

                {/* ===== LEVEL MAP ===== */}
                <div className="hp-map-area">
                    {loading ? (
                        <div className="hp-loading">
                            <div className="hp-spinner"></div>
                            <p>Memuat Level...</p>
                        </div>
                    ) : puzzles.length === 0 ? (
                        <div className="hp-empty">
                            <p>Belum ada level. Minta admin buat dulu! 🧐</p>
                        </div>
                    ) : (
                        <div className="hp-level-path">
                            {puzzles.map((p, index) => {
                                const isUnlocked = p.level <= maxUnlockedLevel || p.is_completed;
                                const status = p.is_completed ? 'completed' : isUnlocked ? 'unlocked' : 'locked';
                                const isLeft = index % 2 === 0;

                                return (
                                    <div key={p.id} className="hp-level-item" style={{ animationDelay: `${index * 0.08}s` }}>
                                        {/* Connector line */}
                                        {index > 0 && (
                                            <div className={`hp-connector ${isLeft ? 'left' : 'right'}`}>
                                                <svg width="80" height="50" viewBox="0 0 80 50">
                                                    <path
                                                        d={isLeft ? "M60 0 Q60 25 20 50" : "M20 0 Q20 25 60 50"}
                                                        fill="none"
                                                        stroke={status === 'locked' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)'}
                                                        strokeWidth="3"
                                                        strokeDasharray={status === 'locked' ? '6 4' : 'none'}
                                                    />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Level Node */}
                                        <div className={`hp-level-row ${isLeft ? 'row-left' : 'row-right'}`}>
                                            <Link
                                                to={isUnlocked ? `/play/${p.level}` : '#'}
                                                className={`hp-node ${status}`}
                                                onClick={(e) => !isUnlocked && e.preventDefault()}
                                            >
                                                <span className="hp-node-num">
                                                    {status === 'locked' ? '🔒' : p.level}
                                                </span>
                                                {p.is_completed && p.stars && (
                                                    <div className="hp-node-stars">
                                                        {'⭐'.repeat(Math.min(p.stars, 3))}
                                                    </div>
                                                )}
                                            </Link>

                                            {/* Label */}
                                            <div className={`hp-level-label ${status}`}>
                                                <span className="hp-label-title">{p.title}</span>
                                                {p.is_completed && <span className="hp-label-check">✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <footer className="hp-footer">
                    TTS Quest • Brain Flex 🧠
                </footer>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');

                /* ===== CSS VARIABLES FOR THEMING ===== */
                :root {
                    --bg-gradient: linear-gradient(180deg, #5BA3D9 0%, #7EC8E3 25%, #ADE4C0 50%, #8BBF6A 70%, #5A9E3E 90%, #3D7A28 100%);
                    --card-bg: rgba(255,255,255,0.95);
                    --card-shadow: rgba(0,0,0,0.1);
                    --text-primary: #2D3748;
                    --text-secondary: #718096;
                    --node-locked-bg: linear-gradient(135deg,#9CA3AF,#6B7280);
                }
                [data-theme="dark"] {
                    --bg-gradient: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #1a1a2e 75%, #0f0f23 100%);
                    --card-bg: rgba(30,30,50,0.95);
                    --card-shadow: rgba(0,0,0,0.4);
                    --text-primary: #E2E8F0;
                    --text-secondary: #A0AEC0;
                    --node-locked-bg: linear-gradient(135deg,#4A5568,#2D3748);
                }

                .hp-page {
                    position: fixed; inset: 0;
                    font-family: 'Nunito', sans-serif;
                    overflow: hidden;
                    user-select: none;
                }

                /* ===== BACKGROUND ===== */
                .hp-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
                .hp-bg-sky {
                    position: absolute; inset: 0;
                    background: var(--bg-gradient);
                    transition: background 0.3s ease;
                }
                .hp-bg-sun {
                    position: absolute; top: 3%; right: 10%;
                    width: 100px; height: 100px;
                    background: radial-gradient(circle, rgba(255,250,200,0.95) 0%, rgba(255,220,100,0.4) 40%, transparent 65%);
                    border-radius: 50%;
                }
                .hp-bg-cloud {
                    position: absolute;
                    background: rgba(255,255,255,0.5);
                    border-radius: 100px;
                    filter: blur(2px);
                }
                .hp-c1 { top: 6%; left: 5%; width: 100px; height: 28px; animation: hpDrift 30s linear infinite; }
                .hp-c2 { top: 12%; right: 8%; width: 80px; height: 22px; animation: hpDrift 42s linear infinite reverse; }
                .hp-c3 { top: 18%; left: 40%; width: 60px; height: 18px; animation: hpDrift 38s linear infinite; opacity: 0.4; }
                .hp-bg-meadow {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 55%;
                    background: linear-gradient(180deg, transparent 0%, rgba(90,130,50,0.5) 35%, rgba(70,115,40,0.85) 100%);
                    transition: background 0.3s ease;
                }
                [data-theme="dark"] .hp-bg-meadow {
                    background: linear-gradient(180deg, transparent 0%, rgba(20,30,40,0.5) 35%, rgba(15,25,35,0.85) 100%);
                }
                .hp-bg-grass {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 25%;
                    background: linear-gradient(180deg, rgba(60,110,40,0.8) 0%, rgba(40,85,25,1) 100%);
                    transition: background 0.3s ease;
                }
                [data-theme="dark"] .hp-bg-grass {
                    background: linear-gradient(180deg, rgba(20,30,40,0.8) 0%, rgba(10,15,20,1) 100%);
                }
                [data-theme="dark"] .hp-bg-sun {
                    background: radial-gradient(circle, rgba(150,150,200,0.3) 0%, rgba(100,100,150,0.15) 40%, transparent 65%);
                }
                [data-theme="dark"] .hp-bg-cloud {
                    background: rgba(100,100,150,0.2);
                }
                .hp-particle {
                    position: absolute; width: 5px; height: 5px;
                    background: rgba(255,255,200,0.6); border-radius: 50%;
                    animation: hpFloat 12s ease-in-out infinite;
                }
                .hp-pp1 { top: 35%; left: 20%; }
                .hp-pp2 { top: 50%; left: 70%; animation-delay: 3s; }
                .hp-pp3 { top: 60%; left: 35%; animation-delay: 6s; width: 4px; height: 4px; }

                @keyframes hpDrift { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
                @keyframes hpFloat {
                    0%,100% { transform: translateY(0); opacity: 0.3; }
                    50% { transform: translateY(-20px); opacity: 0.8; }
                }

                /* ===== CONTAINER ===== */
                .hp-container {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 420px;
                    height: 100%; margin: 0 auto;
                    display: flex; flex-direction: column;
                    padding: 12px 16px 8px;
                    box-sizing: border-box;
                }

                /* ===== HEADER ===== */
                .hp-header {
                    display: flex; align-items: center; justify-content: space-between;
                    flex-shrink: 0; margin-bottom: 10px;
                }
                .hp-logo {
                    display: flex; align-items: center; gap: 6px;
                }
                .hp-logo-icon { font-size: 1.5rem; }
                .hp-logo-text {
                    font-weight: 900; font-size: 1.3rem; color: #fff;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    letter-spacing: -0.5px;
                }
                .hp-auth { display: flex; gap: 6px; align-items: center; }
                .hp-theme-btn {
                    width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
                    cursor: pointer; font-size: 0.95rem;
                    transition: all 0.2s;
                    backdrop-filter: blur(4px);
                }
                .hp-theme-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.3); }
                .hp-theme-btn:active { transform: scale(0.95); }
                .hp-user-name {
                    font-weight: 700; font-size: 0.75rem; color: rgba(255,255,255,0.85);
                    margin-right: 4px;
                }
                .hp-auth-btn {
                    padding: 7px 14px;
                    border-radius: 100px; border: none;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 800; font-size: 0.72rem;
                    cursor: pointer; text-decoration: none;
                    transition: all 0.2s; display: inline-block;
                }
                .hp-login-btn {
                    background: rgba(255,255,255,0.9); color: #2D6A4F;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .hp-join-btn {
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                    color: #fff;
                    box-shadow: 0 2px 8px rgba(245,158,11,0.3), 0 2px 0 #B45309;
                }
                .hp-logout-btn {
                    background: rgba(255,255,255,0.2); color: #fff;
                    border: 1.5px solid rgba(255,255,255,0.3);
                    backdrop-filter: blur(6px);
                }
                .hp-admin-btn {
                    background: rgba(255,255,255,0.85); color: #2D6A4F;
                    font-size: 0.85rem; padding: 5px 10px;
                }
                .hp-auth-btn:hover { transform: translateY(-1px); }
                .hp-auth-btn:active { transform: translateY(1px); }

                /* ===== RANKING ===== */
                .hp-ranking-row {
                    flex-shrink: 0; text-align: center; margin-bottom: 10px;
                }
                .hp-ranking-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 10px 24px;
                    background: linear-gradient(135deg, #FBBF24, #F59E0B);
                    border-radius: 100px;
                    font-weight: 900; font-size: 0.85rem;
                    color: #78350F; text-decoration: none;
                    box-shadow: 0 4px 15px rgba(245,158,11,0.35), 0 3px 0 #B45309;
                    border: 2px solid rgba(255,255,255,0.35);
                    transition: all 0.2s;
                    letter-spacing: 0.3px;
                }
                .hp-ranking-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245,158,11,0.45), 0 4px 0 #B45309; }
                .hp-ranking-btn:active { transform: translateY(1px); box-shadow: 0 1px 5px rgba(245,158,11,0.3), 0 1px 0 #B45309; }

                /* ===== LEVEL MAP ===== */
                .hp-map-area {
                    flex: 1; min-height: 0;
                    overflow-y: auto; overflow-x: hidden;
                    padding: 10px 0 20px;
                    scrollbar-width: none;
                }
                .hp-map-area::-webkit-scrollbar { display: none; }

                .hp-level-path {
                    display: flex; flex-direction: column;
                    align-items: center; gap: 0; padding: 10px 0 40px;
                }

                .hp-level-item {
                    position: relative; width: 100%;
                    display: flex; flex-direction: column; align-items: center;
                    animation: hpNodeIn 0.4s ease-out backwards;
                }

                .hp-connector {
                    width: 80px; height: 50px;
                    display: flex; justify-content: center;
                }

                .hp-level-row {
                    display: flex; align-items: center; gap: 12px;
                    width: 100%; padding: 0 20px; box-sizing: border-box;
                }
                .hp-level-row.row-left { justify-content: flex-start; padding-left: 40px; }
                .hp-level-row.row-right { justify-content: flex-end; padding-right: 40px; flex-direction: row-reverse; }

                /* ===== LEVEL NODE ===== */
                .hp-node {
                    width: 62px; height: 62px;
                    border-radius: 50%;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    text-decoration: none; color: #fff;
                    position: relative; flex-shrink: 0;
                    transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .hp-node.completed {
                    background: linear-gradient(145deg, #10B981, #059669);
                    border: 3px solid rgba(255,255,255,0.5);
                    box-shadow: 0 4px 15px rgba(16,185,129,0.4), 0 3px 0 #047857;
                }
                .hp-node.unlocked {
                    background: linear-gradient(145deg, #3B82F6, #2563EB);
                    border: 3px solid rgba(255,255,255,0.5);
                    box-shadow: 0 4px 15px rgba(59,130,246,0.4), 0 3px 0 #1D4ED8;
                    animation: hpBounce 3s ease-in-out infinite;
                }
                .hp-node.locked {
                    background: rgba(0,0,0,0.2);
                    border: 3px solid rgba(255,255,255,0.15);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    cursor: not-allowed; opacity: 0.7;
                    backdrop-filter: blur(4px);
                }
                [data-theme="dark"] .hp-node.locked {
                    background: rgba(50,50,80,0.5);
                    border-color: rgba(100,100,150,0.3);
                }
                .hp-node:hover:not(.locked) {
                    transform: scale(1.12);
                }
                .hp-node:active:not(.locked) {
                    transform: scale(0.95);
                }
                .hp-node-num {
                    font-weight: 900; font-size: 1.3rem;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    position: relative; z-index: 2;
                }
                .hp-node-stars {
                    position: absolute; top: -10px;
                    font-size: 0.5rem; letter-spacing: -1px;
                    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
                }

                /* ===== LABEL ===== */
                .hp-level-label {
                    display: flex; align-items: center; gap: 5px;
                    padding: 6px 14px;
                    background: var(--card-bg);
                    backdrop-filter: blur(8px);
                    border-radius: 12px;
                    max-width: 180px;
                    box-shadow: 0 2px 10px var(--card-shadow);
                    border: 1.5px solid rgba(255,255,255,0.9);
                    transition: all 0.3s ease;
                }
                .hp-level-label.locked {
                    background: rgba(255,255,255,0.35);
                    border-color: rgba(255,255,255,0.2);
                }
                [data-theme="dark"] .hp-level-label.locked {
                    background: rgba(30,30,50,0.5);
                    border-color: rgba(255,255,255,0.1);
                }
                .hp-label-title {
                    font-weight: 700; font-size: 0.72rem;
                    color: var(--text-primary); line-height: 1.3;
                    overflow: hidden; text-overflow: ellipsis;
                    white-space: nowrap;
                    transition: color 0.3s ease;
                }
                .hp-level-label.locked .hp-label-title { color: rgba(255,255,255,0.6); }
                .hp-label-check {
                    flex-shrink: 0;
                    width: 18px; height: 18px;
                    background: #10B981; color: #fff;
                    border-radius: 50%; font-size: 0.6rem; font-weight: 900;
                    display: flex; align-items: center; justify-content: center;
                }

                /* ===== LOADING / EMPTY ===== */
                .hp-loading, .hp-empty {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    height: 200px; gap: 12px; color: rgba(255,255,255,0.7);
                    font-weight: 700; font-size: 0.85rem;
                }
                .hp-spinner {
                    width: 36px; height: 36px;
                    border: 3px solid rgba(255,255,255,0.2);
                    border-top-color: #fff; border-radius: 50%;
                    animation: hpSpin 0.7s linear infinite;
                }

                /* ===== FOOTER ===== */
                .hp-footer {
                    flex-shrink: 0; text-align: center;
                    padding: 8px 0; font-size: 0.65rem;
                    font-weight: 700; color: rgba(255,255,255,0.25);
                    letter-spacing: 0.5px;
                }

                /* ===== ANIMATIONS ===== */
                @keyframes hpSpin { to { transform: rotate(360deg); } }
                @keyframes hpBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes hpNodeIn {
                    0% { transform: translateY(20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }

                /* ===== RESPONSIVE ===== */
                @media (max-height: 650px) {
                    .hp-header { margin-bottom: 6px; }
                    .hp-ranking-row { margin-bottom: 6px; }
                    .hp-node { width: 54px; height: 54px; }
                    .hp-node-num { font-size: 1.1rem; }
                }
                @media (min-width: 500px) {
                    .hp-level-row.row-left { padding-left: 60px; }
                    .hp-level-row.row-right { padding-right: 60px; }
                }
            `}</style>
        </div>
    );
}
