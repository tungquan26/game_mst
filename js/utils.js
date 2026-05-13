// UTILS.JS - ÂM THANH VÀ TOÁN HỌC HÌNH HỌC

const sfxPop = new Audio('assets/pop.wav');
const sfxConnect = new Audio('assets/click.wav');
const sfxFail = new Audio('assets/fail.wav');
const sfxSuccess = new Audio('assets/success.wav');

function playSound(audio) {
    if(!audio) return;
    audio.currentTime = 0;
    audio.play().catch(e => {});
}

function getDistanceToSegment(px, py, x1, y1, x2, y2) {
    let A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) param = dot / len_sq;

    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; } 
    else if (param > 1) { xx = x2; yy = y2; } 
    else { xx = x1 + param * C; yy = y1 + param * D; }

    return Math.hypot(px - xx, py - yy);
}

function ccw(A, B, C) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

function doIntersect(p1, p2, p3, p4) {
    if (p1.id === p3.id || p1.id === p4.id || p2.id === p3.id || p2.id === p4.id) return false;
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}