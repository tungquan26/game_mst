// UI.JS - QUẢN LÝ GIAO DIỆN & MENU

let gameStarted = false; 

const startOverlay = document.getElementById('start-menu-overlay');
const infoModal = document.getElementById('info-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const budgetDisplay = document.getElementById('budgetDisplay');

const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const heartsContainer = document.getElementById('heartsContainer');
const errorToast = document.getElementById('error-toast');

function showErrorToast() {
    errorToast.classList.remove('modal-hidden');
    setTimeout(() => {
        errorToast.classList.add('modal-hidden');
    }, 2000);
}

document.getElementById('btn-exit').addEventListener('click', () => {
    if(confirm("Bạn có chắc muốn thoát ra menu chính?")) {
        gameStarted = false;
        startOverlay.style.opacity = '1';
        startOverlay.classList.remove('modal-hidden');
        playSound(sfxPop);
    }
});

function updateBudgetUI(budget) {
    let displayBudget = Math.max(0, Math.round(budget));
    budgetDisplay.innerText = `Ngân sách hiện tại: $${displayBudget}`;
    budgetDisplay.style.color = budget < -0.5 ? '#ef4444' : 'white';
}

function updateStatsUI() {
    scoreDisplay.innerText = currentScore;
    
    let hearts = "";
    for(let i=0; i<3; i++) {
        hearts += (i < (3 - checksUsed)) ? "❤️" : "🖤";
    }
    heartsContainer.innerHTML = hearts;
}

function getTopScores() {
    let scores = localStorage.getItem('voltConnectTop5');
    return scores ? JSON.parse(scores) : [];
}

function checkTopScore(score) {
    let topScores = getTopScores();
    if (topScores.length < 5 || score > topScores[topScores.length - 1].score) {
        return true;
    }
    return false;
}

function saveNewScore(nickname, score) {
    let topScores = getTopScores();
    topScores.push({ name: nickname || "Ẩn danh", score: score });
    topScores.sort((a, b) => b.score - a.score);
    topScores = topScores.slice(0, 5);
    localStorage.setItem('voltConnectTop5', JSON.stringify(topScores));
}

function endGame(isWin) {
    gameStarted = false;
    playSound(isWin ? sfxSuccess : sfxFail);
    
    modalTitle.innerText = isWin ? "CHÚC MỪNG!" : "THẤT BẠI!";
    let color = isWin ? '#22c55e' : '#ef4444';
    let isTop = checkTopScore(currentScore);

    document.getElementById('btn-close-modal').style.display = 'none';

    let contentHTML = `
        <div class="result-stats-box">
            <h2 style="color:${color}; margin-top: 0;">${isWin ? 'Hoàn thành chiến dịch!' : 'Hết số lần kiểm tra!'}</h2>
            <p style="font-size: 18px; color: white;">Điểm số: <strong style="color:#facc15; font-size: 24px;">${currentScore}</strong></p>
            
            ${isTop ? `
                <div style="border-top: 1px solid #38bdf8; margin-top: 15px; padding-top: 15px;">
                    <p style="color: #22c55e; font-weight: bold;">✨ ĐÃ XÁC NHẬN KỶ LỤC MỚI! ✨</p>
                    <input type="text" id="nickname-input" placeholder="Nhập Nickname của bạn..." maxlength="15">
                </div>
            ` : ''}
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="btn-save-and-restart" style="width: 100%; padding: 12px; font-size: 16px; border-color: #38bdf8; color: #38bdf8;">
                ${isTop ? 'Lưu kỷ lục & Chơi lại' : 'Chơi lại từ đầu'}
            </button>
            <button id="btn-close-gameover" style="width: 100%; padding: 12px; font-size: 16px; border-color: #94a3b8; color: #94a3b8;">Đóng</button>
        </div>
    `;

    modalBody.innerHTML = contentHTML;
    infoModal.classList.remove('modal-hidden');

    document.getElementById('btn-save-and-restart').addEventListener('click', () => {
        if (isTop) {
            let name = document.getElementById('nickname-input').value;
            saveNewScore(name, currentScore);
        }
        infoModal.classList.add('modal-hidden');
        document.getElementById('btn-close-modal').style.display = '';
        playSound(sfxPop);
        startCampaign();
    });

    document.getElementById('btn-close-gameover').addEventListener('click', () => {
        if (isTop) {
            let name = document.getElementById('nickname-input').value;
            saveNewScore(name, currentScore);
        }
        infoModal.classList.add('modal-hidden');
        document.getElementById('btn-close-modal').style.display = '';
        playSound(sfxPop);
        startOverlay.style.opacity = '1';
        startOverlay.classList.remove('modal-hidden');
    });
}

document.getElementById('btn-high-score').addEventListener('click', () => {
    let topScores = getTopScores();
    modalTitle.innerText = "BẢNG VÀNG TOP 5";
    
    let tableHTML = `<div class="result-stats-box"><table class="high-score-table">`;
    
    if (topScores.length === 0) {
        tableHTML += `<tr><td colspan="3" style="text-align:center; padding: 20px; color: #94a3b8;">Chưa có kỷ lục nào!</td></tr>`;
    } else {
        topScores.forEach((item, index) => {
            let rankColor = index === 0 ? '#facc15' : (index === 1 ? '#cbd5e1' : (index === 2 ? '#d97706' : '#38bdf8'));
            tableHTML += `
                <tr>
                    <td class="rank-col" style="color: ${rankColor};">#${index + 1}</td>
                    <td class="name-col">${item.name}</td>
                    <td class="score-col">${item.score}</td>
                </tr>
            `;
        });
    }
    tableHTML += `</table></div>`;
    
    modalBody.innerHTML = tableHTML;
    infoModal.classList.remove('modal-hidden');
    playSound(sfxPop);
});

document.getElementById('btn-start-game').addEventListener('click', () => {
    startOverlay.style.opacity = '0';
    setTimeout(() => {
        startOverlay.classList.add('modal-hidden');
        startCampaign();
    }, 500);
    playSound(sfxSuccess); 
});

document.getElementById('btn-instructions').addEventListener('click', () => {
    modalTitle.innerText = "HƯỚNG DẪN";
    modalBody.innerHTML = `
        <div class="result-stats-box">
            <ul class="instruction-list">
                <li><b>Nhiệm vụ:</b> Nối tất cả trạm với chi phí rẻ nhất.</li>
                <li>Qua màn sau 1 lần bấm: <b style="color:#22c55e;">+100đ</b>. Lần 2: <b style="color:#facc15;">+90đ</b>. Lần 3: <b style="color:#f97316;">+80đ</b>.</li>
                <li>Sai 3 lần sẽ <b style="color:#ef4444;">Game Over</b>.</li>
            </ul>
        </div>
    `;
    infoModal.classList.remove('modal-hidden');
    playSound(sfxPop);
});

document.getElementById('btn-close-modal').addEventListener('click', () => {
    infoModal.classList.add('modal-hidden');
    playSound(sfxPop);
});