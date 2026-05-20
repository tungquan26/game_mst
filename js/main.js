// MAIN.JS - ĐỘNG CƠ GAME (GAME ENGINE)

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let cities = [];
let allPossibleWires = [];
let mstSolution = [];
let playerWires = [];

let initialBudget = 0;
let currentBudget = 0;

let currentLevel = 1;
const maxLevel = 10;
let currentScore = 0;
let checksUsed = 0;

let mouseX = 0, mouseY = 0;
let hoverCity = -1;
let hoverWire = null; 
let hoverDashedWire = null; 
let showSolution = false;

function startCampaign() {
    currentLevel = 1;
    currentScore = 0;
    gameStarted = true;
    loadLevel(currentLevel);
}

function loadLevel(level) {
    cities = []; playerWires = []; showSolution = false;
    hoverWire = null; hoverDashedWire = null;
    checksUsed = 0;
    updateStatsUI();

    let numNodes = 4 + level;
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let maxRadius = Math.min(canvas.width, canvas.height) * 0.35;

    if (window.innerWidth > 800) centerX += 100;

    let coords = [];
    
    if (numNodes <= 6) {
        for(let i = 0; i < numNodes; i++) {
            coords.push({
                x: centerX + maxRadius * Math.cos(i * Math.PI * 2 / numNodes - Math.PI / 2),
                y: centerY + maxRadius * Math.sin(i * Math.PI * 2 / numNodes - Math.PI / 2)
            });
        }
    } else {
        let innerCount = Math.floor((numNodes - 1) / 3);
        let outerCount = numNodes - innerCount;

        if (innerCount === 1) {
            coords.push({x: centerX, y: centerY});
        } else {
            let innerRadius = maxRadius * 0.4;
            for(let i = 0; i < innerCount; i++) {
                coords.push({
                    x: centerX + innerRadius * Math.cos(i * Math.PI * 2 / innerCount),
                    y: centerY + innerRadius * Math.sin(i * Math.PI * 2 / innerCount)
                });
            }
        }
        for(let i = 0; i < outerCount; i++) {
            coords.push({
                x: centerX + maxRadius * Math.cos(i * Math.PI * 2 / outerCount + Math.PI / outerCount),
                y: centerY + maxRadius * Math.sin(i * Math.PI * 2 / outerCount + Math.PI / outerCount)
            });
        }
    }

    for(let i = 0; i < coords.length; i++) {
        cities.push({ id: i, x: coords[i].x, y: coords[i].y, isPlant: (i === 0), label: String.fromCharCode(65 + (i % 26)) });
    }

    calculateMST();
    currentBudget = initialBudget;
    updateBudgetUI(currentBudget);
}

function calculateMST() {
    allPossibleWires = []; mstSolution = [];
    for(let i=0; i<cities.length; i++) {
        for(let j=i+1; j<cities.length; j++) {
            allPossibleWires.push({ u: i, v: j, weight: Math.hypot(cities[i].x - cities[j].x, cities[i].y - cities[j].y), isRendered: false });
        }
    }
    allPossibleWires.sort((a, b) => a.weight - b.weight);

    let parent = Array.from({length: cities.length}, (_, i) => i);
    function find(i) { return parent[i] === i ? i : parent[i] = find(parent[i]); }

    initialBudget = 0;
    let renderedEdges = [];

    for(let w of allPossibleWires) {
        let rootU = find(w.u), rootV = find(w.v);
        if(rootU !== rootV) {
            parent[rootU] = rootV;
            mstSolution.push(w);
            initialBudget += w.weight;
            w.isRendered = true; 
            renderedEdges.push(w);
        }
    }

    for (let w of allPossibleWires) {
        if (w.isRendered) continue; 
        let u1 = cities[w.u], v1 = cities[w.v], crosses = false;
        for (let r of renderedEdges) {
            if (doIntersect(u1, v1, cities[r.u], cities[r.v])) { crosses = true; break; }
        }
        if (!crosses) { w.isRendered = true; renderedEdges.push(w); }
    }
}

document.getElementById('btn-check').addEventListener('click', () => {
    if(showSolution || !gameStarted) return;
    
    let isCorrect = playerWires.length === cities.length - 1;
    
    let parent = Array.from({length: cities.length}, (_, i) => i);
    function find(i) { return parent[i] === i ? i : parent[i] = find(parent[i]); }
    
    let totalPlayerWeight = 0;
    for(let pw of playerWires) {
        let rootU = find(pw.u);
        let rootV = find(pw.v);
        if (rootU !== rootV) {
            parent[rootU] = rootV;
        } else {
            isCorrect = false;
        }
        totalPlayerWeight += pw.cost;
    }
    
    if (Math.abs(totalPlayerWeight - initialBudget) > 0.1) {
        isCorrect = false;
    }

    for(let pw of playerWires) {
        pw.isWrong = false;
        if (!isCorrect) {
            let found = mstSolution.some(mw => (pw.u === mw.u && pw.v === mw.v) || (pw.u === mw.v && pw.v === mw.u));
            if (!found) pw.isWrong = true;
        }
    }

    if(isCorrect) {
        mstSolution = playerWires.map(pw => ({ u: pw.u, v: pw.v, weight: pw.cost }));
        playSound(sfxSuccess);
        showSolution = true;

        let pts = 100;
        if(checksUsed === 1) pts = 90;
        if(checksUsed === 2) pts = 80;
        currentScore += pts;
        updateStatsUI();

        setTimeout(() => {
            currentLevel++;
            if(currentLevel > maxLevel) {
                endGame(true);
            } else {
                loadLevel(currentLevel);
            }
        }, 2000); 

    } else {
        playSound(sfxFail);
        checksUsed++;
        showErrorToast();
        updateStatsUI();

        if(checksUsed >= 3) {
            showSolution = true;
            setTimeout(() => {
                endGame(false);
            }, 2000);
        } else {
            playerWires = [];
            currentBudget = initialBudget;
            hoverWire = null;
            hoverDashedWire = null;
            updateBudgetUI(currentBudget);
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if(!gameStarted) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top;
    
    let oldHoverCity = hoverCity; hoverCity = -1; hoverWire = null; hoverDashedWire = null;
    
    for(let c of cities) {
        if(Math.hypot(c.x - mouseX, c.y - mouseY) <= 25) { hoverCity = c.id; break; }
    }

    if (hoverCity === -1 && !showSolution) {
        for (let w of playerWires) {
            if (getDistanceToSegment(mouseX, mouseY, cities[w.u].x, cities[w.u].y, cities[w.v].x, cities[w.v].y) < 8) { hoverWire = w; break; }
        }
        if (!hoverWire) {
            for (let w of allPossibleWires) {
                if (w.isRendered && getDistanceToSegment(mouseX, mouseY, cities[w.u].x, cities[w.u].y, cities[w.v].x, cities[w.v].y) < 8) { hoverDashedWire = w; break; }
            }
        }
    }
    if(hoverCity !== -1 && hoverCity !== oldHoverCity) playSound(sfxPop);
});

canvas.addEventListener('mousedown', (e) => {
    if (!gameStarted || showSolution || (e.clientX < 350 && e.clientY < 300)) return; 

    if (hoverWire) {
        let idx = playerWires.indexOf(hoverWire);
        if (idx !== -1) {
            playerWires.splice(idx, 1);
            currentBudget += hoverWire.cost;
            playSound(sfxPop);
            updateBudgetUI(currentBudget);
            hoverDashedWire = allPossibleWires.find(w => ((w.u === hoverWire.u && w.v === hoverWire.v) || (w.u === hoverWire.v && w.v === hoverWire.u)) && w.isRendered);
            hoverWire = null; 
        }
        return;
    }

    if (hoverDashedWire) {
        if (currentBudget + 0.5 >= hoverDashedWire.weight) {
            playerWires.push({ u: hoverDashedWire.u, v: hoverDashedWire.v, isWrong: false, progress: 0.0, cost: hoverDashedWire.weight });
            currentBudget -= hoverDashedWire.weight;
            playSound(sfxConnect);
            updateBudgetUI(currentBudget);
            hoverWire = playerWires[playerWires.length - 1];
            hoverDashedWire = null;
        } else playSound(sfxFail);
    }
});

function drawLine(x1, y1, x2, y2, color, width, glowColor = null) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.shadowBlur = glowColor ? 15 : 0; ctx.shadowColor = glowColor || 'transparent';
    ctx.stroke(); ctx.shadowBlur = 0;
}

function gameLoop() {
    if (!gameStarted) { requestAnimationFrame(gameLoop); return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setLineDash([4, 6]);
    for(let w of allPossibleWires) {
        if (w.isRendered) {
            let isHoveredDashed = (hoverDashedWire === w);
            let lineColor = isHoveredDashed ? '#38bdf8' : 'rgba(255, 255, 255, 0.7)';
            let lineWidth = isHoveredDashed ? 4 : 2;
            let glow = isHoveredDashed ? '#38bdf8' : 'rgba(0,0,0,0.8)';
            drawLine(cities[w.u].x, cities[w.u].y, cities[w.v].x, cities[w.v].y, lineColor, lineWidth, glow);
        }
    }
    ctx.setLineDash([]);

    if(showSolution) {
        for(let w of mstSolution) drawLine(cities[w.u].x, cities[w.u].y, cities[w.v].x, cities[w.v].y, 'rgba(34, 197, 94, 0.9)', 6, '#22c55e');
    }

    for(let pw of playerWires) {
        if(pw.progress < 1.0) pw.progress += 0.05; 
        if(pw.progress > 1.0) pw.progress = 1.0;
        let u = cities[pw.u], v = cities[pw.v];
        let currX = u.x + (v.x - u.x) * pw.progress, currY = u.y + (v.y - u.y) * pw.progress;
        let isHovered = (hoverWire === pw);
        
        let color = (pw.isWrong && showSolution) ? '#ef4444' : (isHovered ? '#fde047' : '#facc15'); 
        let glow = (pw.isWrong && showSolution) ? '#ef4444' : (isHovered ? '#facc15' : 'rgba(0,0,0,0.8)');
        drawLine(u.x, u.y, currX, currY, color, isHovered ? 6 : 4, glow);
    }

    for(let w of allPossibleWires) {
        if (w.isRendered) {
            let midX = (cities[w.u].x + cities[w.v].x) / 2, midY = (cities[w.u].y + cities[w.v].y) / 2;
            let isBuilt = playerWires.some(pw => (pw.u === w.u && pw.v === w.v) || (pw.u === w.v && pw.v === w.u));
            let isHovered = (hoverDashedWire === w) || (hoverWire && ((hoverWire.u === w.u && hoverWire.v === w.v) || (hoverWire.u === w.v && hoverWire.v === w.u)));
            ctx.font = 'bold 12px sans-serif';
            let costText = `$${Math.floor(w.weight)}`, textWidth = ctx.measureText(costText).width;
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(midX - textWidth/2 - 6, midY - 10, textWidth + 12, 20, 4); 
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = isBuilt ? '#facc15' : (isHovered ? '#7dd3fc' : '#ffffff');
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(costText, midX, midY);
        }
    }

    for(let c of cities) {
        ctx.beginPath(); ctx.arc(c.x, c.y, 24, 0, Math.PI * 2);
        if(hoverCity === c.id) { ctx.shadowBlur = 20; ctx.shadowColor = '#38bdf8'; ctx.fillStyle = 'rgba(56, 189, 248, 0.8)'; } 
        else { ctx.shadowBlur = 10; ctx.shadowColor = 'black'; ctx.fillStyle = 'rgba(14, 165, 233, 0.6)'; }
        ctx.fill();
        
        ctx.beginPath(); ctx.arc(c.x, c.y, 18, 0, Math.PI * 2); 
        ctx.shadowBlur = 0; 
        ctx.fillStyle = '#0f172a'; 
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '14px sans-serif';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(c.isPlant ? '🏭' : '🏠', c.x, c.y - 6);
        ctx.font = 'bold 13px sans-serif'; 
        ctx.fillText(c.label, c.x, c.y + 10);
        ctx.shadowBlur = 0; 
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

gameLoop();