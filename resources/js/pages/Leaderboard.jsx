import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/leaderboard')
            .then(res => {
                setLeaders(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const medals = ['🥇', '🥈', '🥉'];
    const podiumColors = [
        'linear-gradient(135deg, #FBBF24, #F59E0B)',
        'linear-gradient(135deg, #9CA3AF, #6B7280)',
        'linear-gradient(135deg, #D97706, #B45309)',
    ];

    return (
        <div className="lb-page">
            <div className="lb-bg">
                <div className="lb-bg-sky"></div>
                <div className="lb-bg-sun"></div>
                <div className="lb-bg-cloud lc1"></div>
                <div className="lb-bg-cloud lc2"></div>
                <div className="lb-bg-meadow"></div>
                <div className="lb-bg-grass"></div>
            </div>

            <div className="lb-container">
                {/* Header */}
                <header className="lb-header">
                    <Link to="/" className="lb-back">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div className="lb-title-group">
                        <h1 className="lb-title">🏆 Ranking</h1>
                        <p className="lb-subtitle">Pemain terbaik TTS Quest</p>
                    </div>
                    <div style={{ width: 38 }}></div>
                </header>

                {/* Content */}
                <div className="lb-content">
                    {loading ? (
                        <div className="lb-loading">
                            <div className="lb-spinner"></div>
                            <p>Memuat ranking...</p>
                        </div>
                    ) : leaders.length === 0 ? (
                        <div className="lb-empty">
                            <div className="lb-empty-icon">🏆</div>
                            <p>Belum ada pemain. Jadilah yang pertama!</p>
                        </div>
                    ) : (
                        <div className="lb-list">
                            {leaders.map((user, index) => (
                                <div
                                    key={index}
                                    className={`lb-row ${index < 3 ? 'lb-top' : ''}`}
                                    style={{ animationDelay: `${index * 0.06}s` }}
                                >
                                    {/* Rank */}
                                    <div className="lb-rank">
                                        {index < 3 ? (
                                            <span className="lb-medal">{medals[index]}</span>
                                        ) : (
                                            <span className="lb-rank-num">{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="lb-avatar" style={{
                                        background: index < 3 ? podiumColors[index] : 'linear-gradient(135deg, #94A3B8, #64748B)'
                                    }}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="lb-info">
                                        <div className="lb-name">{user.name}</div>
                                        <div className="lb-stars">
                                            {'⭐'.repeat(Math.min(3, user.total_stars || 0))}
                                            {(!user.total_stars || user.total_stars === 0) && (
                                                <span className="lb-no-stars">Belum ada bintang</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="lb-score">
                                        <span className="lb-score-val">{user.total_score || 0}</span>
                                        <span className="lb-score-lbl">poin</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lb-footer">
                    Skor = kecepatan × akurasi − hints
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
                .lb-page { position: fixed; inset: 0; font-family: 'Nunito', sans-serif; overflow: hidden; }
                .lb-bg { position: absolute; inset: 0; z-index: 0; }
                .lb-bg-sky { position: absolute; inset: 0; background: linear-gradient(180deg, #4A90C4 0%, #5BA3D9 20%, #7EC8E3 40%, #ADE4C0 60%, #8BBF6A 80%, #5A9E3E 95%, #3D7A28 100%); }
                .lb-bg-sun { position: absolute; top: 4%; right: 10%; width: 80px; height: 80px; background: radial-gradient(circle, rgba(255,250,200,0.9) 0%, rgba(255,220,100,0.4) 40%, transparent 65%); border-radius: 50%; }
                .lb-bg-cloud { position: absolute; background: rgba(255,255,255,0.4); border-radius: 100px; filter: blur(2px); }
                .lc1 { top: 6%; left: 8%; width: 90px; height: 24px; animation: lbDrift 35s linear infinite; }
                .lc2 { top: 13%; right: 5%; width: 65px; height: 18px; animation: lbDrift 42s linear infinite reverse; }
                .lb-bg-meadow { position: absolute; bottom: 0; left: 0; right: 0; height: 45%; background: linear-gradient(180deg, transparent, rgba(70,115,40,0.85)); }
                .lb-bg-grass { position: absolute; bottom: 0; left: 0; right: 0; height: 20%; background: linear-gradient(180deg, rgba(60,110,40,0.8), rgba(40,85,25,1)); }
                @keyframes lbDrift { from { transform: translateX(-100px); } to { transform: translateX(calc(100vw + 100px)); } }

                .lb-container { position: relative; z-index: 1; width: 100%; max-width: 420px; height: 100%; margin: 0 auto; display: flex; flex-direction: column; padding: 12px 14px 8px; box-sizing: border-box; }

                .lb-header { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; margin-bottom: 12px; }
                .lb-back { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); backdrop-filter: blur(8px); border-radius: 50%; color: #fff; text-decoration: none; border: 2px solid rgba(255,255,255,0.12); transition: all 0.2s; }
                .lb-back:hover { background: rgba(0,0,0,0.35); }
                .lb-title-group { text-align: center; }
                .lb-title { font-size: 1.2rem; font-weight: 900; color: #fff; margin: 0; text-shadow: 0 2px 6px rgba(0,0,0,0.15); }
                .lb-subtitle { font-size: 0.65rem; color: rgba(255,255,255,0.65); font-weight: 700; margin: 2px 0 0; }

                .lb-content { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; }
                .lb-content::-webkit-scrollbar { display: none; }

                .lb-list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 20px; }
                .lb-row {
                    display: flex; align-items: center; gap: 10px;
                    padding: 12px 14px;
                    background: rgba(255,255,255,0.88);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    border: 1.5px solid rgba(255,255,255,0.9);
                    box-shadow: 0 3px 12px rgba(0,0,0,0.06);
                    animation: lbRowIn 0.35s ease-out backwards;
                    transition: transform 0.15s;
                }
                .lb-row:hover { transform: translateX(3px); }
                .lb-top { border-width: 2px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
                .lb-top:first-child { background: linear-gradient(135deg, rgba(255,251,235,0.95), rgba(255,255,255,0.95)); border-color: #FBBF24; }

                .lb-rank { width: 32px; text-align: center; flex-shrink: 0; }
                .lb-medal { font-size: 1.4rem; }
                .lb-rank-num { font-weight: 900; font-size: 0.85rem; color: #94A3B8; }

                .lb-avatar {
                    width: 38px; height: 38px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; font-weight: 900; font-size: 0.9rem;
                    flex-shrink: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    border: 2px solid rgba(255,255,255,0.4);
                }

                .lb-info { flex: 1; min-width: 0; }
                .lb-name { font-weight: 800; font-size: 0.85rem; color: #2D3748; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .lb-stars { font-size: 0.6rem; line-height: 1; }
                .lb-no-stars { color: #CBD5E1; font-size: 0.65rem; font-weight: 600; }

                .lb-score { text-align: right; flex-shrink: 0; }
                .lb-score-val { display: block; font-weight: 900; font-size: 1.1rem; color: #F59E0B; }
                .lb-score-lbl { font-size: 0.55rem; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

                .lb-loading, .lb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; gap: 12px; }
                .lb-loading p, .lb-empty p { color: rgba(255,255,255,0.7); font-weight: 700; font-size: 0.85rem; }
                .lb-spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: lbSpin 0.7s linear infinite; }
                .lb-empty-icon { font-size: 3rem; opacity: 0.5; }

                .lb-footer { flex-shrink: 0; text-align: center; padding: 10px 0; font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.25); letter-spacing: 0.3px; }

                @keyframes lbSpin { to { transform: rotate(360deg); } }
                @keyframes lbRowIn { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
