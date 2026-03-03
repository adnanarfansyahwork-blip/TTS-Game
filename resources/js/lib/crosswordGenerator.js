export function generateCrossword(items) {
    if (!items || items.length === 0) return null;

    let words = items.map((item, index) => ({
        id: index + 1,
        word: item.word.toUpperCase().replace(/\s+/g, ''),
        clue: item.clue,
        placed: false,
        x: 0,
        y: 0,
        direction: null
    }));

    // Sort by length (longest first) for better placement
    words.sort((a, b) => b.word.length - a.word.length);

    // Sparse grid using coordinate keys
    let gridObject = {};

    function getKey(x, y) { return `${x},${y}`; }

    function getCell(x, y) { return gridObject[getKey(x, y)] || null; }

    function setCell(x, y, letter, wordId) {
        let key = getKey(x, y);
        if (!gridObject[key]) {
            gridObject[key] = { letter, wordIds: [wordId] };
        } else {
            // Cell already exists — letter MUST match (intersection)
            if (gridObject[key].letter !== letter) {
                console.error(`Letter conflict at (${x},${y}): existing='${gridObject[key].letter}', new='${letter}'`);
                return false;
            }
            gridObject[key].wordIds.push(wordId);
        }
        return true;
    }

    // Place first word horizontally at center
    words[0].x = 0;
    words[0].y = 0;
    words[0].direction = 'across';
    words[0].placed = true;
    placeWordInGrid(words[0]);

    // Try to place remaining words
    for (let i = 1; i < words.length; i++) {
        const candidate = words[i];
        let bestPlacement = null;
        let bestScore = -1;

        // Try intersecting with every placed word
        for (let j = 0; j < words.length; j++) {
            if (j === i || !words[j].placed) continue;
            const placed = words[j];

            // Find all character intersections (positions where letters match)
            for (let ci = 0; ci < candidate.word.length; ci++) {
                for (let pi = 0; pi < placed.word.length; pi++) {
                    if (candidate.word[ci] !== placed.word[pi]) continue;

                    // Candidate must go in opposite direction
                    const newDir = placed.direction === 'across' ? 'down' : 'across';
                    let startX, startY;

                    if (placed.direction === 'across') {
                        // Placed word goes horizontal, candidate goes vertical
                        // Intersection point is at placed.x + pi, placed.y
                        // Candidate's ci-th letter should be at that point
                        startX = placed.x + pi;
                        startY = placed.y - ci;
                    } else {
                        // Placed word goes vertical, candidate goes horizontal
                        // Intersection point is at placed.x, placed.y + pi
                        startX = placed.x - ci;
                        startY = placed.y + pi;
                    }

                    if (isValidPlacement(candidate.word, startX, startY, newDir, candidate.id)) {
                        // Score: prefer more central placements
                        const score = 100 - Math.abs(startX) - Math.abs(startY);
                        if (score > bestScore) {
                            bestScore = score;
                            bestPlacement = { x: startX, y: startY, direction: newDir };
                        }
                    }
                }
            }
        }

        if (bestPlacement) {
            candidate.x = bestPlacement.x;
            candidate.y = bestPlacement.y;
            candidate.direction = bestPlacement.direction;
            candidate.placed = true;
            placeWordInGrid(candidate);
        }
    }

    function placeWordInGrid(wordObj) {
        for (let i = 0; i < wordObj.word.length; i++) {
            let cx = wordObj.direction === 'across' ? wordObj.x + i : wordObj.x;
            let cy = wordObj.direction === 'down' ? wordObj.y + i : wordObj.y;
            setCell(cx, cy, wordObj.word[i], wordObj.id);
        }
    }

    function isValidPlacement(word, x, y, dir, wordId) {
        for (let i = 0; i < word.length; i++) {
            let cx = dir === 'across' ? x + i : x;
            let cy = dir === 'down' ? y + i : y;
            let existing = getCell(cx, cy);

            // If cell occupied, letter must match (valid intersection)
            if (existing && existing.letter !== word[i]) {
                return false;
            }

            // If cell is free, check adjacent cells to avoid parallel touching
            if (!existing) {
                if (dir === 'across') {
                    // Check above and below
                    if (getCell(cx, cy - 1)) return false;
                    if (getCell(cx, cy + 1)) return false;
                    // Check before start and after end
                    if (i === 0 && getCell(cx - 1, cy)) return false;
                    if (i === word.length - 1 && getCell(cx + 1, cy)) return false;
                } else {
                    // Check left and right
                    if (getCell(cx - 1, cy)) return false;
                    if (getCell(cx + 1, cy)) return false;
                    // Check before start and after end
                    if (i === 0 && getCell(cx, cy - 1)) return false;
                    if (i === word.length - 1 && getCell(cx, cy + 1)) return false;
                }
            }
        }
        return true;
    }

    // --- Build the final normalized grid ---
    const placedWords = words.filter(w => w.placed);
    if (placedWords.length === 0) return null;

    // Find bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    placedWords.forEach(w => {
        let endX = w.direction === 'across' ? w.x + w.word.length - 1 : w.x;
        let endY = w.direction === 'down' ? w.y + w.word.length - 1 : w.y;
        minX = Math.min(minX, w.x);
        minY = Math.min(minY, w.y);
        maxX = Math.max(maxX, endX);
        maxY = Math.max(maxY, endY);
    });

    let width = maxX - minX + 1;
    let height = maxY - minY + 1;

    // Normalize coordinates to 0-based
    placedWords.forEach(w => {
        w.nx = w.x - minX;
        w.ny = w.y - minY;
    });

    // Assign sequence numbers (by position, top-to-bottom, left-to-right)
    const startPositions = {};
    placedWords.forEach(w => {
        let k = `${w.ny},${w.nx}`; // y first for sorting
        if (!startPositions[k]) startPositions[k] = { nx: w.nx, ny: w.ny, words: [] };
        startPositions[k].words.push(w);
    });

    let sequence = 1;
    Object.keys(startPositions)
        .sort((a, b) => {
            const [ay, ax] = a.split(',').map(Number);
            const [by, bx] = b.split(',').map(Number);
            return ay !== by ? ay - by : ax - bx;
        })
        .forEach(k => {
            startPositions[k].words.forEach(w => w.number = sequence);
            sequence++;
        });

    // Build grid array
    let grid = Array(height).fill(null).map(() => Array(width).fill(null));

    placedWords.forEach(w => {
        for (let i = 0; i < w.word.length; i++) {
            let cx = w.direction === 'across' ? w.nx + i : w.nx;
            let cy = w.direction === 'down' ? w.ny + i : w.ny;

            if (!grid[cy][cx]) {
                grid[cy][cx] = {
                    letter: w.word[i],
                    isStart: false,
                    startLabel: null,
                    belongsTo: []
                };
            }

            // Verify letter consistency at intersections
            if (grid[cy][cx].letter !== w.word[i]) {
                console.error(`Grid letter mismatch at (${cx},${cy}): grid='${grid[cy][cx].letter}', word='${w.word}' char='${w.word[i]}'`);
                // Force correct letter (this shouldn't happen with valid placement)
                grid[cy][cx].letter = w.word[i];
            }

            grid[cy][cx].belongsTo.push({
                id: w.id,
                dir: w.direction,
                index: i
            });

            if (i === 0) {
                grid[cy][cx].isStart = true;
                grid[cy][cx].startLabel = w.number;
            }
        }
    });

    return { grid, width, height, words: placedWords };
}
