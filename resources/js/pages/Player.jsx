import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Player() {
    const { level } = useParams();
    const navigate = useNavigate();
    const [puzzle, setPuzzle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedWords, setCompletedWords] = useState([]);
    const [solved, setSolved] = useState(false);

    const [isSwiping, setIsSwiping] = useState(false);
    const [selectedLetterIndices, setSelectedLetterIndices] = useState([]);
    const [wheelLetters, setWheelLetters] = useState([]);
    const [hintedCells, setHintedCells] = useState([]);
    const [hintsUsed, setHintsUsed] = useState(0);

    const [hintIndex, setHintIndex] = useState(0);
    const startTimeRef = useRef(Date.now());
    const [result, setResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCorrect, setShowCorrect] = useState(false);
    const [shuffleKey, setShuffleKey] = useState(0);
    const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

    // Keyboard input state
    const [selectedCell, setSelectedCell] = useState(null); // {x, y} in ORIGINAL coords
    const [typedLetters, setTypedLetters] = useState({}); // "x,y" -> letter
    const [inputDirection, setInputDirection] = useState('across'); // 'across' | 'down'
    const [showClues, setShowClues] = useState(false);

    const wheelRef = useRef(null);
    const gridAreaRef = useRef(null);
    const pageRef = useRef(null);

    useEffect(() => {
        const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        axios.get(`/api/puzzles/level/${level}`, { headers })
            .then(res => {
                setPuzzle(res.data);
                // Calculate max frequency of each letter across all words
                // e.g., MALAM needs M×2, A×1, L×1 — so wheel must have 2 M's
                const letterMaxCount = {};
                res.data.words.forEach(w => {
                    const freq = {};
                    w.word.toUpperCase().split('').forEach(ch => {
                        freq[ch] = (freq[ch] || 0) + 1;
                    });
                    Object.entries(freq).forEach(([ch, count]) => {
                        letterMaxCount[ch] = Math.max(letterMaxCount[ch] || 0, count);
                    });
                });
                // Build wheel letters with correct duplicate count
                const wheelChars = [];
                Object.entries(letterMaxCount).forEach(([ch, count]) => {
                    for (let i = 0; i < count; i++) wheelChars.push(ch);
                });
                setWheelLetters(wheelChars.sort(() => Math.random() - 0.5));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [level]);

    // Reset ALL game state when level changes
    useEffect(() => {
        setSolved(false);
        setCompletedWords([]);
        setTypedLetters({});
        setHintedCells([]);
        setHintsUsed(0);
        setHintIndex(0);
        setResult(null);
        setIsSubmitting(false);
        setShowCorrect(false);
        setSelectedCell(null);
        setSelectedLetterIndices([]);
        setShowClues(false);
        setInputDirection('across');
        startTimeRef.current = Date.now();
        setLoading(true);
    }, [level]);

    useEffect(() => {
        if (!puzzle || isSwiping || solved) return;
        const interval = setInterval(() => {
            setHintIndex(prev => (prev + 1) % puzzle.words.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [puzzle, isSwiping, solved]);

    // ===== KEYBOARD INPUT HANDLER =====
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!puzzle || solved || !selectedCell) return;
            const { x, y } = selectedCell;

            if (e.key === 'ArrowRight') { e.preventDefault(); moveCell(1, 0); setInputDirection('across'); return; }
            if (e.key === 'ArrowLeft') { e.preventDefault(); moveCell(-1, 0); setInputDirection('across'); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); moveCell(0, 1); setInputDirection('down'); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); moveCell(0, -1); setInputDirection('down'); return; }
            if (e.key === 'Tab') { e.preventDefault(); setInputDirection(d => d === 'across' ? 'down' : 'across'); return; }

            if (e.key === 'Backspace') {
                e.preventDefault();
                const key = `${x},${y}`;
                if (typedLetters[key]) {
                    setTypedLetters(prev => { const n = { ...prev }; delete n[key]; return n; });
                } else {
                    // Move back then delete
                    const dx = inputDirection === 'across' ? -1 : 0;
                    const dy = inputDirection === 'down' ? -1 : 0;
                    const nx = x + dx, ny = y + dy;
                    if (puzzle.grid[ny]?.[nx]) {
                        setSelectedCell({ x: nx, y: ny });
                        const nk = `${nx},${ny}`;
                        setTypedLetters(prev => { const n = { ...prev }; delete n[nk]; return n; });
                    }
                }
                return;
            }

            if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                const letter = e.key.toUpperCase();
                const key = `${x},${y}`;
                setTypedLetters(prev => ({ ...prev, [key]: letter }));
                // Auto-advance
                const dx = inputDirection === 'across' ? 1 : 0;
                const dy = inputDirection === 'down' ? 1 : 0;
                const nx = x + dx, ny = y + dy;
                if (puzzle.grid[ny]?.[nx]) setSelectedCell({ x: nx, y: ny });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [puzzle, solved, selectedCell, typedLetters, inputDirection]);

    const moveCell = (dx, dy) => {
        if (!selectedCell || !puzzle) return;
        let nx = selectedCell.x + dx, ny = selectedCell.y + dy;
        // Skip empty cells
        while (ny >= 0 && ny < puzzle.grid.length && nx >= 0 && nx < (puzzle.grid[0]?.length || 0)) {
            if (puzzle.grid[ny]?.[nx]) { setSelectedCell({ x: nx, y: ny }); return; }
            nx += dx; ny += dy;
        }
    };

    // Check for word completion from typed letters + hinted cells + completed crossing words
    useEffect(() => {
        if (!puzzle) return;
        puzzle.words.forEach(w => {
            if (completedWords.includes(w.word)) return;
            let allMatch = true;
            for (let i = 0; i < w.word.length; i++) {
                const cx = w.direction === 'across' ? w.nx + i : w.nx;
                const cy = w.direction === 'across' ? w.ny : w.ny + i;
                const expectedLetter = w.word[i].toUpperCase();
                const typed = typedLetters[`${cx},${cy}`];
                const isHinted = hintedCells.some(h => h.x === cx && h.y === cy);
                // Check if this cell is filled by a completed crossing word
                const isFilledByCrossing = puzzle.words.some(other =>
                    completedWords.includes(other.word) &&
                    Array.from({ length: other.word.length }, (_, j) => ({
                        x: other.direction === 'across' ? other.nx + j : other.nx,
                        y: other.direction === 'across' ? other.ny : other.ny + j,
                        letter: other.word[j].toUpperCase()
                    })).some(c => c.x === cx && c.y === cy && c.letter === expectedLetter)
                );

                if (typed === expectedLetter || isHinted || isFilledByCrossing) {
                    continue; // This cell is correct
                } else {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) {
                setCompletedWords(prev => [...prev, w.word]);
                setShowCorrect(true);
                setTimeout(() => setShowCorrect(false), 800);
            }
        });
    }, [typedLetters, hintedCells, completedWords, puzzle]);

    const handleCellClick = (origX, origY) => {
        if (solved) return;
        if (selectedCell && selectedCell.x === origX && selectedCell.y === origY) {
            setInputDirection(d => d === 'across' ? 'down' : 'across');
        } else {
            setSelectedCell({ x: origX, y: origY });
        }
        pageRef.current?.focus();
    };

    useEffect(() => {
        if (puzzle && completedWords.length === puzzle.words.length && !solved) {
            handleWin();
        }
    }, [completedWords, puzzle]);

    const handleWin = async () => {
        setSolved(true);
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Save completed level to localStorage (works without login)
        try {
            const completed = JSON.parse(localStorage.getItem('completed_levels') || '[]');
            const lvl = parseInt(level);
            if (!completed.includes(lvl)) {
                completed.push(lvl);
                localStorage.setItem('completed_levels', JSON.stringify(completed));
            }
        } catch (e) { console.error(e); }

        const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
        if (token) {
            setIsSubmitting(true);
            try {
                const res = await axios.post('/api/submit-result', {
                    puzzle_id: puzzle.id,
                    time_taken: timeTaken,
                    hints_used: hintsUsed
                }, { headers: { Authorization: `Bearer ${token}` } });
                setResult(res.data);
            } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
        }
    };

    const startSwipe = (index) => {
        setIsSwiping(true);
        setSelectedLetterIndices([index]);
        if (window.navigator?.vibrate) window.navigator.vibrate(12);
    };

    const onMove = (e) => {
        if (!isSwiping) return;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const element = document.elementFromPoint(clientX, clientY);
        const letterIndex = element?.getAttribute('data-wheel-index');

        if (letterIndex !== null && letterIndex !== undefined) {
            const idx = parseInt(letterIndex);
            if (!selectedLetterIndices.includes(idx)) {
                setSelectedLetterIndices(prev => [...prev, idx]);
                if (window.navigator?.vibrate) window.navigator.vibrate(8);
            }
        }
    };

    const endSwipe = () => {
        if (!isSwiping) return;
        const formedWord = selectedLetterIndices.map(i => wheelLetters[i]).join('').toUpperCase();
        const match = puzzle.words.find(w => w.word.toUpperCase() === formedWord);
        if (match && !completedWords.includes(match.word)) {
            setCompletedWords(prev => [...prev, match.word]);
            setShowCorrect(true);
            setTimeout(() => setShowCorrect(false), 1000);
        }
        setIsSwiping(false);
        setSelectedLetterIndices([]);
    };

    const shuffleLetters = () => {
        setWheelLetters(prev => [...prev].sort(() => Math.random() - 0.5));
        setShuffleKey(prev => prev + 1);
    };

    const useHint = () => {
        if (solved) return;
        const unrevealed = [];
        puzzle.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const isWordCompleted = cell.belongsTo.some(b =>
                        completedWords.includes(puzzle.words.find(w => w.id === b.id).word)
                    );
                    const isAlreadyHinted = hintedCells.some(h => h.x === x && h.y === y);
                    if (!isWordCompleted && !isAlreadyHinted) unrevealed.push({ x, y, letter: cell.letter });
                }
            });
        });
        if (unrevealed.length > 0) {
            const rand = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            setHintedCells(prev => [...prev, rand]);
            setHintsUsed(prev => prev + 1);
        }
    };

    // Trim grid: remove fully empty rows and columns
    const trimmedGrid = useMemo(() => {
        if (!puzzle) return { grid: [], cols: 0, rows: 0, offsetX: 0, offsetY: 0 };

        const origGrid = puzzle.grid;
        const origRows = origGrid.length;
        const origCols = origGrid[0]?.length || 0;

        // Find bounds of non-null cells
        let minR = origRows, maxR = -1, minC = origCols, maxC = -1;
        for (let y = 0; y < origRows; y++) {
            for (let x = 0; x < origCols; x++) {
                if (origGrid[y][x]) {
                    if (y < minR) minR = y;
                    if (y > maxR) maxR = y;
                    if (x < minC) minC = x;
                    if (x > maxC) maxC = x;
                }
            }
        }

        if (maxR === -1) return { grid: [], cols: 0, rows: 0, offsetX: 0, offsetY: 0 };

        const trimmed = [];
        for (let y = minR; y <= maxR; y++) {
            const row = [];
            for (let x = minC; x <= maxC; x++) {
                row.push(origGrid[y][x]);
            }
            trimmed.push(row);
        }

        return {
            grid: trimmed,
            cols: maxC - minC + 1,
            rows: maxR - minR + 1,
            offsetX: minC,
            offsetY: minR
        };
    }, [puzzle]);

    if (loading) return (
        <div className="cq-loading">
            <div className="cq-loading-spinner"></div>
            <p className="cq-loading-text">Memuat Level...</p>
        </div>
    );

    if (!puzzle) return null;

    const currentWordDisplay = selectedLetterIndices.map(i => wheelLetters[i]).join('').toUpperCase();
    const activeHint = puzzle.words[hintIndex];

    const { grid: tGrid, cols: tCols, rows: tRows, offsetX, offsetY } = trimmedGrid;

    const isDesktop = windowSize.w >= 700;

    // --- Cell size calc ---
    const maxGridWidth = isDesktop ? Math.min(windowSize.w * 0.45, 420) : Math.min(windowSize.w - 32, 380);
    const maxGridHeight = isDesktop ? windowSize.h * 0.50 : windowSize.h * 0.32;
    const gap = 4;
    const cellFromWidth = Math.floor((maxGridWidth - (tCols - 1) * gap) / tCols);
    const cellFromHeight = Math.floor((maxGridHeight - (tRows - 1) * gap) / tRows);
    const cellSize = Math.min(cellFromWidth, cellFromHeight, isDesktop ? 56 : 52);
    const gridWidth = tCols * cellSize + (tCols - 1) * gap;

    // Wheel sizing - scale to viewport
    const mobileWheelMax = Math.min(windowSize.w * 0.52, windowSize.h * 0.30, 220);
    const vw = isDesktop ? Math.min(windowSize.w * 0.35, 320) : Math.min(windowSize.w, 420);
    const wheelSize = isDesktop ? Math.min(vw * 0.55, 170) : mobileWheelMax;
    const charSize = Math.min(wheelSize * 0.20, isDesktop ? 38 : 40);
    const wheelRadius = wheelSize * 0.36;

    // Sorted clues by number for display
    const sortedClues = [...puzzle.words].sort((a, b) => a.number - b.number);
    const acrossClues = puzzle.words.filter(w => w.direction === 'across');
    const downClues = puzzle.words.filter(w => w.direction === 'down');

    return (
        <div className="cq-page" ref={pageRef} tabIndex={-1} style={{ outline: 'none' }}>
            {/* ===== NATURE BACKGROUND ===== */}
            <div className="cq-bg">
                <div className="cq-bg-sky"></div>
                <div className="cq-bg-sun"></div>
                <div className="cq-bg-cloud cq-cloud-1"></div>
                <div className="cq-bg-cloud cq-cloud-2"></div>
                <div className="cq-bg-meadow"></div>
                <div className="cq-bg-grass"></div>
                <div className="cq-particle cq-p1"></div>
                <div className="cq-particle cq-p2"></div>
                <div className="cq-particle cq-p3"></div>
                <div className="cq-particle cq-p4"></div>
            </div>

            <div className="cq-container">
                {/* ===== HEADER ===== */}
                <header className="cq-header">
                    <Link to="/" className="cq-back-btn">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>

                    <div className="cq-level-pill">
                        <span className="cq-level-icon">🌿</span>
                        Level {puzzle.level}
                    </div>

                    <button className="cq-hint-btn" onClick={useHint}>
                        💡
                    </button>
                </header>

                {/* ===== CLUE ===== */}
                <div className="cq-clue-strip">
                    <p className="cq-clue-text">{activeHint.clue}</p>
                    <div className="cq-clue-dots">
                        {puzzle.words.map((w, i) => (
                            <span key={i} className={`cq-dot ${i === hintIndex ? 'active' : ''} ${completedWords.includes(w.word) ? 'done' : ''}`}></span>
                        ))}
                    </div>
                </div>

                {/* ===== DESKTOP LAYOUT: grid + clue side by side ===== */}
                <div className="cq-main-area">
                    <div className="cq-grid-col">
                        {/* ===== CROSSWORD GRID ===== */}
                        <div className="cq-grid-area" ref={gridAreaRef}>
                            <div className="cq-grid" style={{
                                gridTemplateColumns: `repeat(${tCols}, ${cellSize}px)`,
                                gap: `${gap}px`,
                                width: gridWidth,
                            }}>
                                {tGrid.map((row, y) => row.map((cell, x) => {
                                    if (!cell) return <div key={`${x}-${y}`} className="cq-cell cq-cell-empty" style={{ width: cellSize, height: cellSize }} />;

                                    const origX = x + offsetX;
                                    const origY = y + offsetY;

                                    const isFilled = cell.belongsTo.some(b =>
                                        completedWords.includes(puzzle.words.find(w => w.id === b.id).word)
                                    );
                                    const isHinted = hintedCells.some(h => h.x === origX && h.y === origY);
                                    const isSelected = selectedCell && selectedCell.x === origX && selectedCell.y === origY;
                                    const typedLetter = typedLetters[`${origX},${origY}`];
                                    const showLetter = isFilled || isHinted;
                                    const cellNum = cell.isStart ? cell.startLabel : null;

                                    return (
                                        <div key={`${x}-${y}`}
                                            className={`cq-cell ${isFilled ? 'cq-cell-filled' : isHinted ? 'cq-cell-hinted' : isSelected ? 'cq-cell-selected' : 'cq-cell-blank'}`}
                                            style={{ width: cellSize, height: cellSize, cursor: 'pointer' }}
                                            onClick={() => handleCellClick(origX, origY)}
                                        >
                                            {cellNum && <span className="cq-cell-number">{cellNum}</span>}
                                            {showLetter ? (
                                                <span className={`cq-cell-letter ${isFilled ? 'pop' : ''}`}>
                                                    {cell.letter.toUpperCase()}
                                                </span>
                                            ) : typedLetter ? (
                                                <span className="cq-cell-letter cq-typed">{typedLetter}</span>
                                            ) : null}
                                            {isHinted && !isFilled && <div className="cq-hint-indicator"></div>}
                                        </div>
                                    );
                                }))}
                            </div>
                        </div>

                        {/* ===== CLUE LIST TOGGLE (Mobile only) ===== */}
                        <div className="cq-clue-toggle-row">
                            <button className="cq-clue-toggle" onClick={() => setShowClues(!showClues)}>
                                {showClues ? '▼ Sembunyikan Clue' : '▲ Daftar Clue (Across / Down)'}
                            </button>
                        </div>
                        {showClues && (
                            <div className="cq-clue-panel cq-clue-panel-mobile">
                                <div className="cq-clue-col" style={{ width: '100%' }}>
                                    {sortedClues.map(w => (
                                        <div key={w.id} className={`cq-clue-item ${completedWords.includes(w.word) ? 'done' : ''}`}
                                            onClick={() => { setSelectedCell({ x: w.nx, y: w.ny }); setInputDirection(w.direction); setShowClues(false); pageRef.current?.focus(); }}>
                                            <span className="cq-ci-num">{w.number}.</span>
                                            <span className="cq-ci-text">{w.clue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ===== WORD PREVIEW ===== */}
                        <div className="cq-preview-area">
                            {currentWordDisplay.length > 0 && (
                                <div className={`cq-preview-bubble ${showCorrect ? 'correct' : ''}`}>
                                    {currentWordDisplay}
                                </div>
                            )}
                        </div>

                        {/* ===== LETTER WHEEL ===== */}
                        <div className="cq-wheel-section">
                            <button className="cq-tool-btn" onClick={shuffleLetters} title="Shuffle">
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            <div
                                ref={wheelRef}
                                onMouseMove={onMove} onMouseUp={endSwipe} onMouseLeave={endSwipe}
                                onTouchMove={onMove} onTouchEnd={endSwipe}
                                className="cq-wheel"
                                style={{ width: wheelSize, height: wheelSize }}
                            >
                                {/* Decorative rings */}
                                <div className="cq-wheel-ring-outer" style={{ width: wheelSize - 6, height: wheelSize - 6 }}></div>
                                <div className="cq-wheel-ring-inner" style={{ width: wheelSize * 0.35, height: wheelSize * 0.35 }}></div>

                                {/* SVG Lines */}
                                <svg className="cq-wheel-svg" style={{ width: wheelSize, height: wheelSize }}>
                                    <defs>
                                        <linearGradient id="swipeLine" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#F97316" />
                                            <stop offset="100%" stopColor="#EF4444" />
                                        </linearGradient>
                                    </defs>
                                    {selectedLetterIndices.map((idx, i) => {
                                        if (i === 0) return null;
                                        const prevIdx = selectedLetterIndices[i - 1];
                                        const a1 = (prevIdx / wheelLetters.length) * 2 * Math.PI - Math.PI / 2;
                                        const a2 = (idx / wheelLetters.length) * 2 * Math.PI - Math.PI / 2;
                                        return <line key={i}
                                            x1={wheelSize / 2 + wheelRadius * Math.cos(a1)}
                                            y1={wheelSize / 2 + wheelRadius * Math.sin(a1)}
                                            x2={wheelSize / 2 + wheelRadius * Math.cos(a2)}
                                            y2={wheelSize / 2 + wheelRadius * Math.sin(a2)}
                                            stroke="url(#swipeLine)" strokeWidth="5" strokeLinecap="round"
                                        />;
                                    })}
                                </svg>

                                {/* Letters */}
                                {wheelLetters.map((char, i) => {
                                    const angle = (i / wheelLetters.length) * 2 * Math.PI - Math.PI / 2;
                                    const x = wheelSize / 2 + wheelRadius * Math.cos(angle);
                                    const y = wheelSize / 2 + wheelRadius * Math.sin(angle);
                                    const isSelected = selectedLetterIndices.includes(i);

                                    return (
                                        <div key={`${shuffleKey}-${i}`} data-wheel-index={i}
                                            onMouseDown={() => startSwipe(i)} onTouchStart={() => startSwipe(i)}
                                            className={`cq-wheel-letter ${isSelected ? 'selected' : ''}`}
                                            style={{
                                                left: x - charSize / 2, top: y - charSize / 2,
                                                width: charSize, height: charSize,
                                                animationDelay: `${i * 0.05}s`
                                            }}
                                        >
                                            {char.toUpperCase()}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="cq-tool-btn cq-tool-placeholder" style={{ visibility: 'hidden' }}>
                                <span>🔍</span>
                            </div>
                        </div>
                    </div>{/* end cq-grid-col */}

                    {/* ===== DESKTOP CLUE SIDEBAR ===== */}
                    <div className="cq-clue-sidebar">
                        <div className="cq-clue-sidebar-inner">
                            {sortedClues.map(w => (
                                <div key={w.id} className={`cq-clue-item ${completedWords.includes(w.word) ? 'done' : ''}`}
                                    onClick={() => { setSelectedCell({ x: w.nx, y: w.ny }); setInputDirection(w.direction); pageRef.current?.focus(); }}>
                                    <span className="cq-ci-num">{w.number}.</span>
                                    <span className="cq-ci-text">{w.clue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>{/* end cq-main-area */}

                {/* ===== WIN MODAL ===== */}
                {solved && (
                    <div className="cq-win-overlay">
                        <div className="cq-win-card">
                            <div className="cq-win-stars">
                                {[1, 2, 3].map(i => (
                                    <span key={i} className="cq-star" style={{ animationDelay: `${i * 0.2}s` }}>⭐</span>
                                ))}
                            </div>
                            <h1 className="cq-win-title">Level Complete!</h1>
                            <p className="cq-win-sub">
                                {result ? `Score: ${result.score}` : 'Keren banget! 🎉'}
                            </p>
                            <div className="cq-win-stats">
                                <div className="cq-win-stat">
                                    <span className="cq-stat-val">{Math.floor((Date.now() - startTimeRef.current) / 1000)}s</span>
                                    <span className="cq-stat-lbl">Waktu</span>
                                </div>
                                <div className="cq-win-divider"></div>
                                <div className="cq-win-stat">
                                    <span className="cq-stat-val">{hintsUsed}</span>
                                    <span className="cq-stat-lbl">Hints</span>
                                </div>
                            </div>
                            <Link to={`/play/${parseInt(level) + 1}`} className="cq-win-btn">
                                Lanjut Level →
                            </Link>
                            <Link to="/" className="cq-home-link">
                                Kembali ke Menu
                            </Link>
                        </div>
                    </div>
                )}

                <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap');

                .cq-page {
                    position: fixed;
                    inset: 0;
                    font-family: 'Nunito', sans-serif;
                    overflow: hidden;
                    user-select: none;
                    -webkit-user-select: none;
                }

                /* ===== BACKGROUND ===== */
                .cq-bg {
                    position: absolute; inset: 0; z-index: 0; overflow: hidden;
                }
                .cq-bg-sky {
                    position: absolute; inset: 0;
                    background: linear-gradient(180deg, #7EC8E3 0%, #ADE4C0 40%, #8BBF6A 65%, #5A9E3E 85%, #3D7A28 100%);
                }
                .cq-bg-sun {
                    position: absolute; top: 4%; right: 12%;
                    width: 90px; height: 90px;
                    background: radial-gradient(circle, rgba(255,250,200,0.95) 0%, rgba(255,220,100,0.5) 35%, transparent 65%);
                    border-radius: 50%;
                }
                .cq-bg-cloud {
                    position: absolute;
                    background: rgba(255,255,255,0.55);
                    border-radius: 100px;
                    filter: blur(3px);
                }
                .cq-cloud-1 { top: 7%; left: 3%; width: 110px; height: 30px; animation: drift 35s linear infinite; }
                .cq-cloud-2 { top: 14%; right: 5%; width: 80px; height: 22px; animation: drift 45s linear infinite reverse; }
                .cq-bg-meadow {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
                    background: linear-gradient(180deg, transparent 0%, rgba(90,130,50,0.5) 30%, rgba(70,115,40,0.85) 100%);
                }
                .cq-bg-grass {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 30%;
                    background: linear-gradient(180deg, rgba(60,110,40,0.8) 0%, rgba(40,85,25,1) 100%);
                }
                .cq-particle {
                    position: absolute; width: 5px; height: 5px;
                    background: rgba(255,255,200,0.7); border-radius: 50%;
                    animation: pFloat 10s ease-in-out infinite;
                }
                .cq-p1 { top: 30%; left: 18%; }
                .cq-p2 { top: 42%; left: 65%; animation-delay: 2s; width: 4px; height: 4px; }
                .cq-p3 { top: 52%; left: 30%; animation-delay: 4s; }
                .cq-p4 { top: 38%; left: 80%; animation-delay: 6s; width: 3px; height: 3px; }

                @keyframes drift { from { transform: translateX(-120px); } to { transform: translateX(calc(100vw + 120px)); } }
                @keyframes pFloat {
                    0%,100% { transform: translateY(0); opacity: 0.3; }
                    50% { transform: translateY(-25px); opacity: 0.8; }
                }

                /* ===== CONTAINER ===== */
                .cq-container {
                    position: relative; z-index: 1;
                    width: 100%; max-width: 420px; height: 100%;
                    margin: 0 auto;
                    display: flex; flex-direction: column;
                    padding: 10px 14px 10px;
                    box-sizing: border-box;
                }

                /* ===== MAIN AREA (grid + sidebar) ===== */
                .cq-main-area {
                    flex: 1; display: flex; flex-direction: column; min-height: 0;
                }
                .cq-grid-col { flex: 1; display: flex; flex-direction: column; min-height: 0; }

                /* Desktop clue sidebar - hidden on mobile */
                .cq-clue-sidebar { display: none; }

                /* ===== HEADER ===== */
                .cq-header {
                    display: flex; align-items: center; justify-content: space-between;
                    flex-shrink: 0; margin-bottom: 6px;
                }
                .cq-back-btn {
                    width: 38px; height: 38px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.22);
                    backdrop-filter: blur(8px);
                    border-radius: 50%; color: #fff; text-decoration: none;
                    border: 2px solid rgba(255,255,255,0.12);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                    transition: all 0.2s;
                }
                .cq-back-btn:hover { background: rgba(0,0,0,0.35); transform: scale(1.05); }
                .cq-level-pill {
                    display: flex; align-items: center; gap: 5px;
                    padding: 7px 18px;
                    background: rgba(0,0,0,0.28);
                    backdrop-filter: blur(10px);
                    border-radius: 100px; color: #fff;
                    font-weight: 800; font-size: 0.82rem;
                    border: 2px solid rgba(255,255,255,0.12);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                }
                .cq-level-icon { font-size: 0.9rem; }
                .cq-hint-btn {
                    width: 38px; height: 38px;
                    display: flex; align-items: center; justify-content: center;
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                    border-radius: 50%; border: 2px solid rgba(255,255,255,0.25);
                    cursor: pointer; font-size: 1rem;
                    box-shadow: 0 3px 12px rgba(245,158,11,0.35);
                    transition: all 0.2s;
                }
                .cq-hint-btn:hover { transform: scale(1.08); }
                .cq-hint-btn:active { transform: scale(0.92); }

                /* ===== CLUE ===== */
                .cq-clue-strip {
                    flex-shrink: 0; text-align: center; margin-bottom: 4px;
                }
                .cq-clue-strip .cq-clue-text {
                    margin: 0; padding: 9px 16px;
                    background: rgba(255,255,255,0.88);
                    backdrop-filter: blur(10px);
                    border-radius: 14px;
                    font-weight: 800; font-size: 0.85rem; color: #2D3748;
                    line-height: 1.35;
                    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
                    border: 2px solid rgba(255,255,255,0.9);
                }
                .cq-clue-dots {
                    display: flex; justify-content: center; gap: 5px; margin-top: 5px;
                }
                .cq-dot {
                    width: 7px; height: 7px;
                    background: rgba(255,255,255,0.25);
                    border-radius: 50%; transition: all 0.3s;
                }
                .cq-dot.active { background: #F59E0B; box-shadow: 0 0 8px rgba(245,158,11,0.6); transform: scale(1.4); }
                .cq-dot.done { background: #10B981; }

                /* ===== GRID ===== */
                .cq-grid-area {
                    flex: 1;
                    display: flex; align-items: center; justify-content: center;
                    min-height: 0; overflow: hidden;
                }
                .cq-grid {
                    display: grid;
                    margin: 0 auto;
                }
                .cq-cell {
                    border-radius: 7px;
                    display: flex; align-items: center; justify-content: center;
                    position: relative;
                    transition: all 0.25s ease;
                }
                .cq-cell-empty {
                    opacity: 0; pointer-events: none;
                }
                .cq-cell-blank {
                    background: linear-gradient(145deg, rgba(25,55,85,0.8), rgba(35,70,105,0.7));
                    border: 1.5px solid rgba(80,130,170,0.35);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.05);
                }
                .cq-cell-selected {
                    background: linear-gradient(145deg, #10B981, #059669);
                    border: 2px solid rgba(255,255,255,0.6);
                    box-shadow: 0 0 14px rgba(16,185,129,0.6), inset 0 1px 2px rgba(255,255,255,0.15);
                    animation: cellGlow 1.5s ease-in-out infinite;
                }
                .cq-cell-filled {
                    background: linear-gradient(145deg, #F59E0B, #EAB308);
                    border: 1.5px solid rgba(255,255,255,0.4);
                    box-shadow: 0 3px 10px rgba(245,158,11,0.45), inset 0 1px 2px rgba(255,255,255,0.3);
                }
                .cq-cell-hinted {
                    background: linear-gradient(145deg, rgba(25,55,85,0.7), rgba(35,70,105,0.6));
                    border: 1.5px solid rgba(245,158,11,0.4);
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);
                }
                .cq-cell-number {
                    position: absolute; top: 1px; left: 3px;
                    font-size: 0.45rem; font-weight: 900;
                    color: rgba(255,255,255,0.6);
                    line-height: 1;
                }
                .cq-cell-letter {
                    font-weight: 900;
                    font-size: clamp(0.75rem, 3.5vw, 1.2rem);
                    color: #fff;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                .cq-cell-letter.pop { animation: cellPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                .cq-typed { color: rgba(255,255,255,0.85); }
                .cq-hint-indicator {
                    position: absolute; top: 3px; right: 3px;
                    width: 5px; height: 5px;
                    background: #F59E0B; border-radius: 50%;
                    box-shadow: 0 0 6px rgba(245,158,11,0.8);
                    animation: pulse 2s infinite;
                }

                /* ===== CLUE PANEL ===== */
                .cq-clue-toggle-row { flex-shrink: 0; text-align: center; margin: 2px 0; }
                .cq-clue-toggle {
                    padding: 5px 16px; border: none;
                    background: rgba(255,255,255,0.2); backdrop-filter: blur(6px);
                    border-radius: 100px; color: rgba(255,255,255,0.75);
                    font-family: 'Nunito'; font-weight: 700; font-size: 0.65rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .cq-clue-toggle:hover { background: rgba(255,255,255,0.3); color: #fff; }
                .cq-clue-panel {
                    display: flex; gap: 8px; max-height: 140px;
                    overflow-y: auto; scrollbar-width: none;
                    background: rgba(255,255,255,0.88); backdrop-filter: blur(10px);
                    border-radius: 14px; padding: 10px;
                    border: 1.5px solid rgba(255,255,255,0.9);
                    margin-bottom: 4px;
                }
                .cq-clue-panel::-webkit-scrollbar { display: none; }
                .cq-clue-col { flex: 1; min-width: 0; }
                .cq-clue-heading { margin: 0 0 4px; font-size: 0.65rem; font-weight: 900; color: #3B82F6; }
                .cq-clue-item {
                    display: flex; gap: 4px; padding: 3px 6px;
                    border-radius: 6px; font-size: 0.6rem; cursor: pointer;
                    transition: background 0.15s; line-height: 1.3;
                }
                .cq-clue-item:hover { background: rgba(59,130,246,0.08); }
                .cq-clue-item.done { opacity: 0.4; text-decoration: line-through; }
                .cq-ci-num { font-weight: 900; color: #3B82F6; flex-shrink: 0; width: 16px; }
                .cq-ci-text { color: #4A5568; font-weight: 600; }

                /* ===== PREVIEW ===== */
                .cq-preview-area {
                    flex-shrink: 0; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                }
                .cq-preview-bubble {
                    padding: 5px 24px;
                    background: linear-gradient(135deg, #10B981, #059669);
                    border-radius: 100px;
                    font-weight: 900; font-size: 1.05rem; color: #fff;
                    letter-spacing: 3px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    box-shadow: 0 3px 15px rgba(16,185,129,0.4);
                    border: 2px solid rgba(255,255,255,0.25);
                    animation: bPop 0.15s ease-out;
                }
                .cq-preview-bubble.correct {
                    background: linear-gradient(135deg, #F59E0B, #D97706);
                    box-shadow: 0 3px 15px rgba(245,158,11,0.5);
                }

                /* ===== WHEEL ===== */
                .cq-wheel-section {
                    flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    gap: 10px; padding-bottom: 10px;
                }
                .cq-tool-btn {
                    width: 40px; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.18);
                    backdrop-filter: blur(6px);
                    border-radius: 50%;
                    border: 2px solid rgba(255,255,255,0.1);
                    cursor: pointer; transition: all 0.2s;
                    color: rgba(255,255,255,0.65);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                }
                .cq-tool-btn:hover { background: rgba(0,0,0,0.3); color: #fff; }
                .cq-tool-btn:active { transform: scale(0.9); }

                .cq-wheel {
                    position: relative;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(6px);
                    border-radius: 50%;
                    touch-action: none;
                    flex-shrink: 0;
                    border: 2px solid rgba(255,255,255,0.1);
                    box-shadow: 0 4px 25px rgba(0,0,0,0.12);
                }
                .cq-wheel-ring-outer {
                    position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    border: 1.5px solid rgba(255,255,255,0.1);
                    pointer-events: none;
                }
                .cq-wheel-ring-inner {
                    position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    border-radius: 50%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    pointer-events: none;
                }
                .cq-wheel-svg {
                    position: absolute; inset: 0;
                    pointer-events: none; overflow: visible;
                }
                .cq-wheel-letter {
                    position: absolute; z-index: 10;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 50%;
                    font-weight: 900; font-size: 1rem;
                    cursor: pointer; user-select: none; -webkit-user-select: none;
                    color: #fff;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.25);
                    background: rgba(255,255,255,0.13);
                    border: 2px solid rgba(255,255,255,0.18);
                    backdrop-filter: blur(4px);
                    transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
                    animation: letterIn 0.35s ease-out backwards;
                }
                .cq-wheel-letter:hover {
                    background: rgba(255,255,255,0.22);
                    transform: scale(1.06);
                }
                .cq-wheel-letter.selected {
                    background: linear-gradient(135deg, #F97316, #EF4444);
                    border-color: rgba(255,255,255,0.45);
                    transform: scale(1.18);
                    box-shadow: 0 0 18px rgba(249,115,22,0.6);
                }

                /* ===== WIN ===== */
                .cq-win-overlay {
                    position: fixed; inset: 0; z-index: 100;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(10px);
                    display: flex; align-items: center; justify-content: center;
                    padding: 24px; animation: fadeIn 0.3s;
                }
                .cq-win-card {
                    width: 100%; max-width: 310px;
                    background: linear-gradient(150deg, #fff, #fdf8ed);
                    border-radius: 24px; padding: 24px 20px;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    animation: modalPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 3px solid rgba(255,255,255,0.8);
                }
                .cq-win-stars { display: flex; justify-content: center; gap: 6px; margin-bottom: 10px; }
                .cq-star {
                    font-size: 2rem;
                    animation: starPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
                    filter: drop-shadow(0 2px 5px rgba(245,158,11,0.4));
                }
                .cq-win-title { font-size: 1.5rem; font-weight: 900; color: #2D3748; margin: 0 0 2px; }
                .cq-win-sub { font-size: 0.8rem; color: #718096; margin: 0 0 16px; font-weight: 600; }
                .cq-win-stats {
                    display: flex; align-items: center; justify-content: center;
                    gap: 20px; margin-bottom: 20px; padding: 10px;
                    background: rgba(0,0,0,0.03); border-radius: 14px;
                }
                .cq-win-stat { text-align: center; }
                .cq-stat-val { display: block; font-size: 1.2rem; font-weight: 900; color: #2D3748; }
                .cq-stat-lbl { font-size: 0.6rem; color: #A0AEC0; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
                .cq-win-divider { width: 1px; height: 35px; background: rgba(0,0,0,0.08); }
                .cq-win-btn {
                    display: block; width: 100%; padding: 13px;
                    background: linear-gradient(135deg, #4CAF50, #2E7D32);
                    border-radius: 14px; color: #fff;
                    font-weight: 800; font-size: 0.95rem;
                    text-decoration: none; text-align: center;
                    box-shadow: 0 4px 12px rgba(76,175,80,0.35), 0 3px 0 #1B5E20;
                    border: 2px solid rgba(255,255,255,0.15);
                    transition: all 0.2s;
                }
                .cq-win-btn:hover { transform: translateY(-2px); }
                .cq-win-btn:active { transform: translateY(1px); box-shadow: 0 1px 4px rgba(76,175,80,0.3), 0 1px 0 #1B5E20; }
                .cq-home-link {
                    display: block; text-align: center; margin-top: 10px;
                    font-size: 0.75rem; font-weight: 700;
                    color: #718096; text-decoration: none;
                    transition: color 0.2s;
                }
                .cq-home-link:hover { color: #4A5568; }

                /* ===== LOADING ===== */
                .cq-loading {
                    position: fixed; inset: 0;
                    background: linear-gradient(180deg, #7EC8E3, #5A9E3E);
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 14px;
                }
                .cq-loading-spinner {
                    width: 40px; height: 40px;
                    border: 4px solid rgba(255,255,255,0.2);
                    border-top-color: #fff; border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }
                .cq-loading-text {
                    font-family: 'Nunito', sans-serif;
                    color: #fff; font-weight: 800; font-size: 0.85rem;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.15);
                }

                /* ===== ANIMATIONS ===== */
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes cellPop {
                    0% { transform: scale(0.4); opacity: 0; }
                    60% { transform: scale(1.12); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes cellGlow {
                    0%, 100% { box-shadow: 0 0 10px rgba(16,185,129,0.4); }
                    50% { box-shadow: 0 0 18px rgba(16,185,129,0.7); }
                }
                @keyframes bPop {
                    0% { transform: scale(0.85); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes modalPop {
                    0% { transform: scale(0.7) translateY(25px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes starPop {
                    0% { transform: scale(0) rotate(-20deg); opacity: 0; }
                    100% { transform: scale(1) rotate(0); opacity: 1; }
                }
                @keyframes letterIn {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.08); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                }

                /* ===== RESPONSIVE ===== */
                @media (max-height: 650px) {
                    .cq-clue-strip .cq-clue-text { padding: 7px 14px; font-size: 0.78rem; border-radius: 11px; }
                    .cq-preview-area { height: 32px; }
                    .cq-container { padding: 6px 12px 6px; }
                    .cq-header { margin-bottom: 4px; }
                    .cq-clue-strip { margin-bottom: 2px; }
                }
                @media (max-height: 550px) {
                    .cq-clue-dots { display: none; }
                }

                /* ===== DESKTOP LAYOUT ===== */
                @media (min-width: 700px) {
                    .cq-container {
                        max-width: 780px;
                        padding: 10px 20px;
                    }
                    .cq-main-area {
                        flex-direction: row;
                        gap: 14px;
                        align-items: flex-start;
                    }
                    .cq-grid-col {
                        flex: 1;
                        align-items: center;
                    }
                    /* Hide mobile clue toggle on desktop */
                    .cq-clue-toggle-row { display: none; }
                    .cq-clue-panel-mobile { display: none; }

                    /* Show desktop sidebar */
                    .cq-clue-sidebar {
                        display: flex;
                        width: 210px;
                        flex-shrink: 0;
                        align-self: flex-start;
                        margin-top: 6px;
                    }
                    .cq-clue-sidebar-inner {
                        width: 100%;
                        background: rgba(255,255,255,0.88);
                        backdrop-filter: blur(10px);
                        border-radius: 14px;
                        padding: 10px 10px;
                        border: 1.5px solid rgba(255,255,255,0.9);
                        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                        overflow-y: auto;
                        scrollbar-width: none;
                        max-height: calc(100vh - 140px);
                    }
                    .cq-clue-sidebar-inner::-webkit-scrollbar { display: none; }
                    .cq-clue-sidebar .cq-clue-heading {
                        font-size: 0.65rem; margin-bottom: 4px;
                    }
                    .cq-clue-sidebar .cq-clue-item {
                        font-size: 0.65rem; padding: 4px 6px;
                        border-radius: 6px; cursor: pointer;
                    }
                    .cq-clue-sidebar .cq-clue-item:hover {
                        background: rgba(59,130,246,0.08);
                    }
                    .cq-grid-area { flex: unset; }
                    .cq-wheel-section { padding-bottom: 4px; padding-top: 0; }
                    .cq-preview-area { height: 24px; }
                }
            `}</style>
            </div>
        </div>
    );
}
