const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');
const gridSizeInput = document.getElementById('grid-size');
const colorPicker = document.getElementById('color-picker');
const btnDraw = document.getElementById('btn-draw');
const btnErase = document.getElementById('btn-erase');
const btnClear = document.getElementById('btn-clear');
const btnDownload = document.getElementById('btn-download');
const exportFormat = document.getElementById('export-format');

// State Variables
let isDrawing = false;
let currentMode = 'draw'; // 'draw' or 'erase'
const canvasSize = 600; // Fixed display size in pixels

function initCanvas() {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    // Fill background with white for JPEG compatibility (no transparency artifacts)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getPixelSize() {
    return canvasSize / gridSizeInput.value;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixelSize = getPixelSize();
    
    // Calculate the top-left corner of the "pixel" clicked
    const gridX = Math.floor(x / pixelSize) * pixelSize;
    const gridY = Math.floor(y / pixelSize) * pixelSize;

    if (currentMode === 'draw') {
        ctx.fillStyle = colorPicker.value;
    } else {
        ctx.fillStyle = "#ffffff"; // Erase acts as painting white
    }

    ctx.fillRect(gridX, gridY, pixelSize, pixelSize);
}

// Event Listeners
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    draw(e);
});

canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', () => isDrawing = false);

// Tool Switching
btnDraw.addEventListener('click', () => {
    currentMode = 'draw';
    btnDraw.classList.add('active');
    btnErase.classList.remove('active');
});

btnErase.addEventListener('click', () => {
    currentMode = 'erase';
    btnErase.classList.add('active');
    btnDraw.classList.remove('active');
});

btnClear.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear your art?")) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
});

// Export Logic
btnDownload.addEventListener('click', () => {
    const format = exportFormat.value;
    const link = document.createElement('a');
    link.download = `pixel-art.${format.split('/')[1]}`;
    link.href = canvas.toDataURL(format, 1.0);
    link.click();
});

// Reset grid when size changes
gridSizeInput.addEventListener('change', () => {
    if(confirm("Changing grid size will clear the current canvas. Proceed?")) {
        initCanvas();
    }
});

// Initialize on load
initCanvas();