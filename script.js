const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');
const gridCanvas = document.getElementById('grid-canvas');
const gridCtx = gridCanvas.getContext('2d');

// UI Elements
const gridSizeInput = document.getElementById('grid-size');
const bgColorPicker = document.getElementById('bg-color-picker');
const colorPicker = document.getElementById('color-picker');
const btnDraw = document.getElementById('btn-draw');
const btnErase = document.getElementById('btn-erase');
const btnClear = document.getElementById('btn-clear');
const btnDownload = document.getElementById('btn-download');
const exportFormat = document.getElementById('export-format');
const checkTransparent = document.getElementById('check-transparent');
const transparencyContainer = document.getElementById('transparency-container');

let isDrawing = false;
let currentMode = 'draw';
const canvasSize = 600;

function init() {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    gridCanvas.width = canvasSize;
    gridCanvas.height = canvasSize;
    
    // Start with a clean transparent canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawGridOverlay();
    
    // Apply initial BG color to the canvas element style for preview
    canvas.style.backgroundColor = bgColorPicker.value;
}

function drawGridOverlay() {
    const pCount = gridSizeInput.value;
    const cellSize = canvasSize / pCount;
    gridCtx.clearRect(0, 0, canvasSize, canvasSize);
    gridCtx.beginPath();
    gridCtx.strokeStyle = "rgba(255, 255, 255, 0.1)"; 
    gridCtx.lineWidth = 0.5;

    for (let i = 0; i <= canvasSize; i += cellSize) {
        gridCtx.moveTo(i, 0); gridCtx.lineTo(i, canvasSize);
        gridCtx.moveTo(0, i); gridCtx.lineTo(canvasSize, i);
    }
    gridCtx.stroke();
}

function handleInput(e) {
    if (!isDrawing) return;
    const rect = gridCanvas.getBoundingClientRect();
    const scale = canvasSize / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    const cellSize = canvasSize / gridSizeInput.value;
    const gx = Math.floor(x / cellSize) * cellSize;
    const gy = Math.floor(y / cellSize) * cellSize;

    if (currentMode === 'draw') {
        ctx.fillStyle = colorPicker.value;
        ctx.fillRect(gx, gy, cellSize, cellSize);
    } else {
        ctx.clearRect(gx, gy, cellSize, cellSize);
    }
}

// Events
gridCanvas.addEventListener('mousedown', (e) => { isDrawing = true; handleInput(e); });
gridCanvas.addEventListener('mousemove', handleInput);
window.addEventListener('mouseup', () => isDrawing = false);

bgColorPicker.addEventListener('input', () => {
    canvas.style.backgroundColor = bgColorPicker.value;
});

gridSizeInput.addEventListener('change', () => {
    if(confirm("Change grid size? This clears the art!")) init();
});

exportFormat.addEventListener('change', () => {
    transparencyContainer.style.display = (exportFormat.value === 'image/jpeg') ? 'none' : 'block';
});

btnDraw.addEventListener('click', () => { currentMode = 'draw'; btnDraw.classList.add('active'); btnErase.classList.remove('active'); });
btnErase.addEventListener('click', () => { currentMode = 'erase'; btnErase.classList.add('active'); btnDraw.classList.remove('active'); });

btnClear.addEventListener('click', () => {
    if(confirm("Clear everything?")) ctx.clearRect(0, 0, canvasSize, canvasSize);
});

btnDownload.addEventListener('click', () => {
    const mime = exportFormat.value;
    const ext = mime.split('/')[1];
    
    // Create export buffer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize;
    tempCanvas.height = canvasSize;
    const tCtx = tempCanvas.getContext('2d');

    // Fill background if not transparent or if format is JPEG
    if (!checkTransparent.checked || mime === 'image/jpeg') {
        tCtx.fillStyle = bgColorPicker.value;
        tCtx.fillRect(0, 0, canvasSize, canvasSize);
    }

    tCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `pixel-art-${Date.now()}.${ext}`;
    link.href = tempCanvas.toDataURL(mime, 0.9);
    link.click();
});

init();