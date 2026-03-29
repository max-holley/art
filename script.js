const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const gridCanvas = document.getElementById('grid-canvas');
const gridCtx = gridCanvas.getContext('2d');
const viewport = document.getElementById('viewport');
const container = document.getElementById('canvas-container');

// Elements
const gridSizeInput = document.getElementById('grid-size');
const bgColorPicker = document.getElementById('bg-color-picker');
const colorPicker = document.getElementById('color-picker');
const btnDraw = document.getElementById('btn-draw');
const btnFill = document.getElementById('btn-fill');
const btnErase = document.getElementById('btn-erase');
const btnClear = document.getElementById('btn-clear');
const btnDownload = document.getElementById('btn-download');
const btnReset = document.getElementById('btn-reset-view');

// State
let isDrawing = false;
let isPanning = false;
let currentMode = 'draw';
let scale = 1;
let translateX = 0;
let translateY = 0;
const canvasSize = 600;

function init() {
    canvas.width = canvasSize; canvas.height = canvasSize;
    gridCanvas.width = canvasSize; gridCanvas.height = canvasSize;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawGrid();
    updateView();
}

function drawGrid() {
    const p = gridSizeInput.value;
    const s = canvasSize / p;
    gridCtx.clearRect(0, 0, canvasSize, canvasSize);
    gridCtx.beginPath();
    gridCtx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    gridCtx.lineWidth = 0.5;
    for (let i = 0; i <= canvasSize; i += s) {
        gridCtx.moveTo(i, 0); gridCtx.lineTo(i, canvasSize);
        gridCtx.moveTo(0, i); gridCtx.lineTo(canvasSize, i);
    }
    gridCtx.stroke();
}

function updateView() {
    container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Zoom Logic
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) return; // Allow browser zoom
    e.preventDefault();
    const zoomSpeed = 0.1;
    if (e.deltaY < 0) scale = Math.min(scale + zoomSpeed, 10);
    else scale = Math.max(scale - zoomSpeed, 0.5);
    updateView();
}, { passive: false });

// Pan & Drawing Logic
let startX, startY;
window.addEventListener('keydown', (e) => { if (e.code === 'Space') isPanning = true; });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') isPanning = false; });

gridCanvas.addEventListener('mousedown', (e) => {
    if (isPanning || e.button === 1) {
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        return;
    }
    isDrawing = true;
    handleInput(e);
});

window.addEventListener('mousemove', (e) => {
    if (isPanning && startX !== undefined) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateView();
        return;
    }
    if (isDrawing) handleInput(e);
});

window.addEventListener('mouseup', () => { isDrawing = false; startX = undefined; });

function handleInput(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale * (canvasSize / (rect.width / scale));
    const y = (e.clientY - rect.top) / scale * (canvasSize / (rect.height / scale));
    
    const pSize = canvasSize / gridSizeInput.value;
    const gx = Math.floor(x / pSize) * pSize;
    const gy = Math.floor(y / pSize) * pSize;

    if (currentMode === 'draw') {
        ctx.fillStyle = colorPicker.value;
        ctx.fillRect(gx, gy, pSize, pSize);
    } else if (currentMode === 'erase') {
        ctx.clearRect(gx, gy, pSize, pSize);
    } else if (currentMode === 'fill') {
        floodFill(Math.floor(x), Math.floor(y), colorPicker.value);
    }
}

// Bucket Fill (Flood Fill Algorithm)
function floodFill(startX, startY, fillColor) {
    const targetColor = ctx.getImageData(startX, startY, 1, 1).data;
    const fillRGB = hexToRgb(fillColor);
    
    if (colorsMatch(targetColor, [fillRGB.r, fillRGB.g, fillRGB.b, 255])) return;

    const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
    const pixels = imageData.data;
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const pos = (y * canvasSize + x) * 4;

        if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) continue;
        if (!colorsMatch([pixels[pos], pixels[pos+1], pixels[pos+2], pixels[pos+3]], targetColor)) continue;

        pixels[pos] = fillRGB.r;
        pixels[pos+1] = fillRGB.g;
        pixels[pos+2] = fillRGB.b;
        pixels[pos+3] = 255;

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function colorsMatch(c1, c2) {
    return Math.abs(c1[0] - c2[0]) < 5 && Math.abs(c1[1] - c2[1]) < 5 && 
           Math.abs(c1[2] - c2[2]) < 5 && Math.abs(c1[3] - c2[3]) < 5;
}

// Tool switching
btnDraw.onclick = () => { currentMode = 'draw'; setActive(btnDraw); };
btnFill.onclick = () => { currentMode = 'fill'; setActive(btnFill); };
btnErase.onclick = () => { currentMode = 'erase'; setActive(btnErase); };
btnReset.onclick = () => { scale = 1; translateX = 0; translateY = 0; updateView(); };
function setActive(btn) { [btnDraw, btnFill, btnErase].forEach(b => b.classList.remove('active')); btn.classList.add('active'); }

// Other logic (Download, Clear, etc) from previous version remains compatible
btnDownload.addEventListener('click', () => {
    const temp = document.createElement('canvas');
    temp.width = canvasSize; temp.height = canvasSize;
    const tCtx = temp.getContext('2d');
    if (!document.getElementById('check-transparent').checked || document.getElementById('export-format').value === 'image/jpeg') {
        tCtx.fillStyle = bgColorPicker.value;
        tCtx.fillRect(0, 0, canvasSize, canvasSize);
    }
    tCtx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = `pixel-art-${Date.now()}.png`;
    link.href = temp.toDataURL(document.getElementById('export-format').value);
    link.click();
});

btnClear.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear your masterpiece? This cannot be undone.")) {
        // 1. Clear the drawing canvas (makes it transparent)
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // 2. Ensure the background preview stays consistent with the picker
        canvas.style.backgroundColor = bgColorPicker.value;
        
        // 3. Reset view if desired (Optional: keeps things tidy)
        // scale = 1; translateX = 0; translateY = 0; updateView();
    }
});

// --- UPDATED INPUT HANDLER FOR SHIFT-SNAP (STRAIGHT LINES) ---
let lastX = null;
let lastY = null;

function handleInput(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale * (canvasSize / (rect.width / scale));
    const y = (e.clientY - rect.top) / scale * (canvasSize / (rect.height / scale));
    
    const pSize = canvasSize / gridSizeInput.value;
    const gx = Math.floor(x / pSize) * pSize;
    const gy = Math.floor(y / pSize) * pSize;

    if (currentMode === 'draw') {
        ctx.fillStyle = colorPicker.value;
        
        // Bonus: If holding Shift, draw a line from the last point
        if (e.shiftKey && lastX !== null) {
            drawLine(lastX, lastY, gx, gy, pSize);
        } else {
            ctx.fillRect(gx, gy, pSize, pSize);
        }
        lastX = gx;
        lastY = gy;
    } else if (currentMode === 'erase') {
        ctx.clearRect(gx, gy, pSize, pSize);
    } else if (currentMode === 'fill') {
        floodFill(Math.floor(x), Math.floor(y), colorPicker.value);
    }
}

// Simple line algorithm for the Shift-Snap feature
function drawLine(x1, y1, x2, y2, size) {
    const dist = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / size;
    for (let i = 0; i <= dist; i++) {
        const t = dist === 0 ? 0 : i / dist;
        const lx = Math.floor((x1 + (x2 - x1) * t) / size) * size;
        const ly = Math.floor((y1 + (y2 - y1) * t) / size) * size;
        ctx.fillRect(lx, ly, size, size);
    }
}

// Reset last position when mouse is released
window.addEventListener('mouseup', () => { 
    isDrawing = false; 
    startX = undefined;
    lastX = null; 
    lastY = null; 
});

init();