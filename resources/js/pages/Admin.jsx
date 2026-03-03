import React, { useState, useEffect } from 'react';
import { generateCrossword } from '../lib/crosswordGenerator';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Admin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'

    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        // Verify server-side that user is actually admin
        axios.get('/api/check-admin', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (res.data.is_admin) {
                setAuthChecked(true);
            } else {
                // Not admin — remove stale token and redirect
                localStorage.removeItem('admin_token');
                alert('Akses ditolak. Kamu bukan admin.');
                navigate('/');
            }
        }).catch(() => {
            localStorage.removeItem('admin_token');
            navigate('/login');
        });
    }, [navigate]);

    // ===== CREATE TAB STATE =====
    const [title, setTitle] = useState('');
    const [level, setLevel] = useState(1);
    const [items, setItems] = useState([
        { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }
    ]);
    const [error, setError] = useState(null);
    const [gridData, setGridData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // ===== HISTORY TAB STATE =====
    const [puzzles, setPuzzles] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchHistory = () => {
        setLoadingHistory(true);
        const token = localStorage.getItem('admin_token');
        axios.get('/api/puzzles', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => { setPuzzles(res.data); setLoadingHistory(false); })
            .catch(() => setLoadingHistory(false));
    };

    useEffect(() => { fetchHistory(); }, []);

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value.toUpperCase().replace(/\s/g, '');
        if (field === 'clue') newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => { if (items.length < 15) setItems([...items, { word: '', clue: '' }]); };

    const removeItem = (index) => {
        if (items.length > 5) setItems(items.filter((_, i) => i !== index));
    };

    const handleGenerate = () => {
        setError(null);
        if (!title.trim()) { setError('Judul TTS tidak boleh kosong!'); return; }
        const validItems = items.filter(i => i.word.trim() && i.clue.trim());
        if (validItems.length < 5) { setError('Minimal harus ada 5 kata dengan clue yang valid!'); return; }

        // Extra validation: no empty words or clues
        for (const item of validItems) {
            if (item.word.trim().length < 2) { setError('Setiap kata harus minimal 2 huruf!'); return; }
            if (!item.clue.trim()) { setError('Semua clue harus diisi!'); return; }
        }

        try {
            const result = generateCrossword(validItems);
            if (!result || result.words.length < validItems.length) {
                setError('Sulit menemukan perpotongan untuk kata-kata tersebut. Coba ganti beberapa kata agar ada huruf yang sama.');
            }
            if (result) setGridData(result);
        } catch (e) { setError('Gagal membuat grid: ' + e.message); }
    };

    const handlePublish = async () => {
        if (!gridData) return;
        setIsSaving(true);
        const token = localStorage.getItem('admin_token');
        try {
            const payload = { title, level, words: gridData.words, grid: gridData.grid };
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingId) {
                await axios.put(`/api/puzzles/${editingId}`, payload, config);
                alert('Puzzle berhasil diperbarui! 🎉');
            } else {
                await axios.post('/api/puzzles', payload, config);
                alert('Puzzle berhasil dipublish! 🎉');
            }

            setGridData(null);
            setTitle('');
            setLevel(1);
            setEditingId(null);
            setItems([{ word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }]);
            fetchHistory();
            setActiveTab('history');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan. Coba login ulang.');
            if (err.response?.status === 401) { localStorage.removeItem('admin_token'); navigate('/login'); }
        } finally { setIsSaving(false); }
    };

    const handleEdit = async (puzzleId) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`/api/puzzles/${puzzleId}`, { headers: { Authorization: `Bearer ${token}` } });
            const p = res.data;

            setEditingId(p.id);
            setTitle(p.title);
            setLevel(p.level);

            // Reconstruct items from words
            const loadedItems = p.words.map(w => ({ word: w.word, clue: w.clue }));
            while (loadedItems.length < 5) loadedItems.push({ word: '', clue: '' });
            setItems(loadedItems);

            // Set gridData for preview
            setGridData({ width: p.grid[0].length, height: p.grid.length, words: p.words, grid: p.grid });

            setActiveTab('create');
        } catch (err) {
            alert('Gagal memuat data puzzle.');
        }
    };

    const handleDelete = async (puzzleId) => {
        if (!window.confirm('Yakin ingin menghapus puzzle ini?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`/api/puzzles/${puzzleId}`, { headers: { Authorization: `Bearer ${token}` } });
            alert('Puzzle terhapus.');
            fetchHistory();
        } catch (err) {
            alert('Gagal menghapus puzzle.');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setLevel(1);
        setItems([{ word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }, { word: '', clue: '' }]);
        setGridData(null);
    };

    const handleLogout = async () => {
        const token = localStorage.getItem('admin_token');
        if (token) await axios.post('/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
        localStorage.removeItem('admin_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        navigate('/login');
    };

    if (!authChecked) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(180deg,#5BA3D9,#3D7A28)', fontFamily: 'Nunito,sans-serif' }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
                <p style={{ fontWeight: 700 }}>Memverifikasi akses admin...</p>
            </div>
        </div>
    );

    return (
        <div className="adm-page">
            <div className="adm-bg">
                <div className="adm-bg-sky"></div>
                <div className="adm-bg-sun"></div>
                <div className="adm-bg-meadow"></div>
                <div className="adm-bg-grass"></div>
            </div>

            <div className="adm-container">
                {/* Header */}
                <header className="adm-header">
                    <Link to="/" className="adm-back">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="adm-title">🛠️ Admin Panel</h1>
                    <button onClick={handleLogout} className="adm-logout">Logout</button>
                </header>

                {/* Tabs */}
                <div className="adm-tabs">
                    <button className={`adm-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
                        ✏️ Buat TTS
                    </button>
                    <button className={`adm-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); fetchHistory(); }}>
                        📋 History ({puzzles.length})
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'create' ? (
                    <div className="adm-layout">
                        {/* Left: Form */}
                        <div className="adm-form-panel">
                            <div className="adm-section">
                                <div className="adm-row">
                                    <div style={{ flex: 1 }}>
                                        <label className="adm-label">Judul Puzzle</label>
                                        <input className="adm-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Hewan Lucu" />
                                    </div>
                                    <div style={{ width: 80 }}>
                                        <label className="adm-label">Level</label>
                                        <input className="adm-input" type="number" value={level} onChange={e => setLevel(parseInt(e.target.value) || 1)} />
                                    </div>
                                </div>
                            </div>

                            <div className="adm-section">
                                <div className="adm-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="adm-label" style={{ margin: 0 }}>Daftar Kata ({items.length}/15) — min 5</label>
                                    <button onClick={addItem} disabled={items.length >= 15} className="adm-add-btn">+ Tambah</button>
                                </div>

                                <div className="adm-words-list">
                                    {items.map((item, i) => (
                                        <div key={i} className="adm-word-item">
                                            <div className="adm-word-num">{i + 1}</div>
                                            <div className="adm-word-fields">
                                                <input className="adm-input adm-input-sm" placeholder="Kata (jawaban)" value={item.word} onChange={e => updateItem(i, 'word', e.target.value)} />
                                                <input className="adm-input adm-input-sm" placeholder="Petunjuk / Clue" value={item.clue} onChange={e => updateItem(i, 'clue', e.target.value)} />
                                            </div>
                                            <button onClick={() => removeItem(i)} disabled={items.length <= 5} className="adm-remove-btn">✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {error && <div className="adm-error">{error}</div>}

                            <button onClick={handleGenerate} className="adm-generate-btn">⚡ Generate Preview</button>
                        </div>

                        {/* Right: Preview */}
                        <div className="adm-preview-panel">
                            <h3 className="adm-preview-title">Preview Grid</h3>
                            {gridData ? (
                                <div className="adm-preview-content">
                                    <div className="adm-grid" style={{ gridTemplateColumns: `repeat(${gridData.width}, 36px)` }}>
                                        {gridData.grid.map((row, y) =>
                                            row.map((cell, x) => (
                                                <div key={`${x}-${y}`} className={`adm-cell ${cell ? 'filled' : 'empty'}`}>
                                                    {cell && cell.isStart && <span className="adm-cell-num">{cell.startLabel}</span>}
                                                    {cell && <span className="adm-cell-letter">{cell.letter}</span>}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="adm-word-list-preview">
                                        <div className="adm-clue-group">
                                            <h4 className="adm-clue-heading">→ Mendatar (Across)</h4>
                                            {gridData.words.filter(w => w.direction === 'across').map((w, i) => (
                                                <div key={i} className="adm-word-preview-item">
                                                    <span className="adm-wp-num">{w.number}.</span>
                                                    <span className="adm-wp-word">{w.word}</span>
                                                    <span className="adm-wp-clue">{w.clue}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="adm-clue-group">
                                            <h4 className="adm-clue-heading">↓ Menurun (Down)</h4>
                                            {gridData.words.filter(w => w.direction === 'down').map((w, i) => (
                                                <div key={i} className="adm-word-preview-item">
                                                    <span className="adm-wp-num">{w.number}.</span>
                                                    <span className="adm-wp-word">{w.word}</span>
                                                    <span className="adm-wp-clue">{w.clue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="adm-success">✓ {gridData.words.length} kata berhasil di-generate</p>
                                    <button onClick={handlePublish} disabled={isSaving} className="adm-publish-btn">
                                        {isSaving ? 'Menyimpan...' : (editingId ? '💾 Simpan Perubahan' : '🚀 Publish Puzzle')}
                                    </button>
                                    {editingId && (
                                        <button onClick={handleCancelEdit} disabled={isSaving} className="adm-cancel-btn" style={{ marginTop: '10px' }}>
                                            ✕ Batal Edit
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="adm-preview-empty">
                                    <div className="adm-pe-icon">🧩</div>
                                    <p>Isi form di sebelah kiri, lalu klik <strong>Generate Preview</strong></p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ===== HISTORY TAB ===== */
                    <div className="adm-history-panel">
                        {loadingHistory ? (
                            <div className="adm-history-loading">
                                <div className="adm-spinner"></div>
                                <p>Memuat history...</p>
                            </div>
                        ) : puzzles.length === 0 ? (
                            <div className="adm-history-empty">
                                <div className="adm-pe-icon">📭</div>
                                <p>Belum ada puzzle. Buat yang pertama!</p>
                            </div>
                        ) : (
                            <div className="adm-history-list">
                                {puzzles.map((p, i) => (
                                    <div key={p.id} className="adm-history-item" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div className="adm-hi-level">Lv.{p.level}</div>
                                        <div className="adm-hi-info">
                                            <div className="adm-hi-title">{p.title}</div>
                                            <div className="adm-hi-date">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                        </div>
                                        <div className="adm-hi-actions">
                                            <button onClick={() => handleEdit(p.id)} className="adm-hi-btn adm-hi-edit">✏️ Edit</button>
                                            <button onClick={() => handleDelete(p.id)} className="adm-hi-btn adm-hi-del">🗑️ Hapus</button>
                                            <Link to={`/play/${p.level}`} className="adm-hi-btn adm-hi-play">▶ Main</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');
                .adm-page { position: fixed; inset: 0; font-family: 'Nunito', sans-serif; overflow-y: auto; }
                .adm-bg { position: fixed; inset: 0; z-index: 0; }
                .adm-bg-sky { position: absolute; inset: 0; background: linear-gradient(180deg, #4A7FB5 0%, #5A9BC7 25%, #7BBE96 55%, #5A9E3E 80%, #3D7A28 100%); }
                .adm-bg-sun { position: absolute; top: 3%; right: 8%; width: 80px; height: 80px; background: radial-gradient(circle, rgba(255,250,200,0.85) 0%, rgba(255,220,100,0.3) 45%, transparent 65%); border-radius: 50%; }
                .adm-bg-meadow { position: absolute; bottom: 0; left: 0; right: 0; height: 40%; background: linear-gradient(180deg, transparent, rgba(70,115,40,0.85)); }
                .adm-bg-grass { position: absolute; bottom: 0; left: 0; right: 0; height: 15%; background: linear-gradient(180deg, rgba(60,110,40,0.8), rgba(40,85,25,1)); }

                .adm-container { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; padding: 14px 16px; box-sizing: border-box; }

                .adm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
                .adm-back { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); backdrop-filter: blur(6px); border-radius: 50%; color: #fff; text-decoration: none; border: 2px solid rgba(255,255,255,0.12); transition: all 0.2s; }
                .adm-back:hover { background: rgba(0,0,0,0.35); }
                .adm-title { font-weight: 900; font-size: 1.1rem; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,0.15); margin: 0; }
                .adm-logout { padding: 7px 14px; background: rgba(255,255,255,0.15); backdrop-filter: blur(6px); border: 1.5px solid rgba(255,255,255,0.2); border-radius: 10px; color: rgba(255,255,255,0.8); font-family: 'Nunito'; font-weight: 800; font-size: 0.7rem; cursor: pointer; transition: all 0.2s; }
                .adm-logout:hover { background: rgba(255,80,80,0.3); color: #fff; }

                /* Tabs */
                .adm-tabs { display: flex; gap: 4px; margin-bottom: 12px; background: rgba(0,0,0,0.15); border-radius: 14px; padding: 3px; }
                .adm-tab { flex: 1; padding: 10px; border: none; background: transparent; border-radius: 12px; font-family: 'Nunito'; font-weight: 800; font-size: 0.78rem; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; }
                .adm-tab.active { background: rgba(255,255,255,0.9); color: #2D3748; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .adm-layout { display: flex; gap: 14px; flex-wrap: wrap; }
                .adm-form-panel { flex: 1 1 320px; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-radius: 20px; padding: 20px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); border: 2px solid rgba(255,255,255,0.95); max-height: calc(100vh - 130px); overflow-y: auto; scrollbar-width: none; }
                .adm-form-panel::-webkit-scrollbar { display: none; }

                .adm-section { margin-bottom: 16px; }
                .adm-row { display: flex; gap: 10px; }
                .adm-label { display: block; font-weight: 800; font-size: 0.7rem; color: #4A5568; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                .adm-input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 2px solid #E2E8F0; background: #F7FAFC; font-family: 'Nunito'; font-size: 0.82rem; font-weight: 600; transition: all 0.2s; box-sizing: border-box; outline: none; }
                .adm-input:focus { border-color: #3B82F6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
                .adm-input-sm { padding: 8px 10px; font-size: 0.78rem; margin-bottom: 4px; }
                .adm-add-btn { padding: 5px 12px; background: #EDF2F7; border: 1.5px solid #E2E8F0; border-radius: 10px; font-family: 'Nunito'; font-weight: 800; font-size: 0.68rem; color: #3B82F6; cursor: pointer; transition: all 0.2s; }
                .adm-add-btn:hover { background: #3B82F6; color: #fff; }
                .adm-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

                .adm-words-list { margin-top: 10px; max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; scrollbar-width: none; }
                .adm-words-list::-webkit-scrollbar { display: none; }
                .adm-word-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #F7FAFC; border-radius: 12px; border: 1.5px solid #EDF2F7; }
                .adm-word-num { width: 22px; height: 22px; background: #E2E8F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.65rem; color: #64748B; flex-shrink: 0; }
                .adm-word-fields { flex: 1; display: flex; flex-direction: column; gap: 3px; }
                .adm-remove-btn { width: 28px; height: 28px; background: transparent; border: 1.5px solid #FCA5A5; border-radius: 8px; color: #EF4444; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; transition: all 0.2s; flex-shrink: 0; }
                .adm-remove-btn:hover { background: #FEE2E2; }
                .adm-remove-btn:disabled { opacity: 0.3; cursor: not-allowed; border-color: #E2E8F0; color: #CBD5E1; }

                .adm-error { background: #FEF2F2; color: #DC2626; border: 1.5px solid #FECACA; padding: 10px 12px; border-radius: 12px; font-weight: 700; font-size: 0.75rem; margin-bottom: 12px; }

                .adm-generate-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #3B82F6, #2563EB); border-radius: 14px; border: none; color: #fff; font-family: 'Nunito'; font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 3px 10px rgba(59,130,246,0.3), 0 2px 0 #1D4ED8; transition: all 0.2s; }
                .adm-generate-btn:hover { transform: translateY(-1px); }
                .adm-generate-btn:active { transform: translateY(1px); }

                /* Preview Panel */
                .adm-preview-panel { flex: 1 1 400px; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-radius: 20px; padding: 20px 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); border: 2px solid rgba(255,255,255,0.95); max-height: calc(100vh - 130px); overflow-y: auto; scrollbar-width: none; }
                .adm-preview-panel::-webkit-scrollbar { display: none; }
                .adm-preview-title { text-align: center; font-weight: 900; font-size: 1rem; color: #2D3748; margin: 0 0 16px; }

                .adm-preview-content { display: flex; flex-direction: column; align-items: center; gap: 16px; }

                .adm-grid { display: grid; gap: 3px; justify-content: center; }
                .adm-cell { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; position: relative; }
                .adm-cell.filled { background: linear-gradient(135deg, #3B82F6, #2563EB); color: #fff; border: 1.5px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .adm-cell.empty { background: transparent; }
                .adm-cell-num { position: absolute; top: 1px; left: 3px; font-size: 0.45rem; font-weight: 900; color: rgba(255,255,255,0.65); }
                .adm-cell-letter { font-size: 0.8rem; font-weight: 800; }

                .adm-word-list-preview { width: 100%; }
                .adm-clue-group { margin-bottom: 10px; }
                .adm-clue-heading { font-size: 0.72rem; font-weight: 900; color: #3B82F6; margin: 0 0 6px; }
                .adm-word-preview-item { display: flex; align-items: baseline; gap: 6px; padding: 5px 10px; background: #F7FAFC; border-radius: 8px; font-size: 0.72rem; margin-bottom: 3px; }
                .adm-wp-num { font-weight: 900; color: #3B82F6; width: 20px; }
                .adm-wp-word { font-weight: 800; color: #2D3748; min-width: 60px; }
                .adm-wp-clue { flex: 1; color: #718096; font-weight: 600; }

                .adm-success { font-weight: 800; font-size: 0.78rem; color: #059669; margin: 0; }
                .adm-publish-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 14px; border: none; color: #fff; font-family: 'Nunito'; font-weight: 900; font-size: 0.9rem; cursor: pointer; box-shadow: 0 3px 10px rgba(16,185,129,0.3), 0 2px 0 #047857; transition: all 0.2s; }
                .adm-publish-btn:hover { transform: translateY(-1px); }
                .adm-publish-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .adm-preview-empty { text-align: center; padding: 50px 20px; color: #94A3B8; }
                .adm-pe-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.5; }
                .adm-preview-empty p { font-weight: 600; font-size: 0.82rem; line-height: 1.6; }

                /* ===== HISTORY TAB ===== */
                .adm-history-panel { background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-radius: 20px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); border: 2px solid rgba(255,255,255,0.95); max-height: calc(100vh - 130px); overflow-y: auto; scrollbar-width: none; }
                .adm-history-panel::-webkit-scrollbar { display: none; }
                .adm-history-loading, .adm-history-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; gap: 10px; color: #94A3B8; font-weight: 700; font-size: 0.85rem; }
                .adm-spinner { width: 32px; height: 32px; border: 3px solid #E2E8F0; border-top-color: #3B82F6; border-radius: 50%; animation: admSpin 0.7s linear infinite; }
                @keyframes admSpin { to { transform: rotate(360deg); } }

                .adm-history-list { display: flex; flex-direction: column; gap: 8px; }
                .adm-history-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #F7FAFC; border-radius: 14px; border: 1.5px solid #EDF2F7; animation: admRowIn 0.3s ease-out backwards; transition: transform 0.15s; }
                .adm-history-item:hover { transform: translateX(3px); }
                .adm-hi-level { width: 42px; height: 42px; background: linear-gradient(135deg, #3B82F6, #2563EB); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 0.7rem; flex-shrink: 0; }
                .adm-hi-info { flex: 1; min-width: 0; }
                .adm-hi-title { font-weight: 800; font-size: 0.85rem; color: #2D3748; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .adm-hi-date { font-size: 0.65rem; color: #94A3B8; font-weight: 600; }
                .adm-hi-actions { display: flex; gap: 6px; }
                .adm-hi-btn { padding: 6px 12px; border-radius: 10px; border: none; font-family: 'Nunito'; font-weight: 800; font-size: 0.68rem; cursor: pointer; text-decoration: none; transition: all 0.2s; }
                .adm-hi-play { background: #10B981; color: #fff; }
                .adm-hi-play:hover { background: #059669; }
                .adm-hi-edit { background: #3B82F6; color: #fff; }
                .adm-hi-edit:hover { background: #2563EB; }
                .adm-hi-del { background: #EF4444; color: #fff; }
                .adm-hi-del:hover { background: #DC2626; }
                .adm-cancel-btn { width: 100%; padding: 12px; background: #FFF; border-radius: 14px; border: 2px solid #EF4444; color: #EF4444; font-family: 'Nunito'; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
                .adm-cancel-btn:hover { background: #FEF2F2; }
                @keyframes admRowIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                @media (max-width: 700px) {
                    .adm-layout { flex-direction: column; }
                    .adm-form-panel, .adm-preview-panel { flex: auto; max-height: none; }
                }
            `}</style>
        </div>
    );
}
