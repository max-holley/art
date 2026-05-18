const canvasSize = 600;

window.onload = () => {
    // Elements
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const gridCanvas = document.getElementById('grid-canvas');
    const gridCtx = gridCanvas.getContext('2d');
    const container = document.getElementById('canvas-container');

    const gridSizeInput = document.getElementById('grid-size');
    const gridOpacityInput = document.getElementById('grid-opacity');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const colorPicker = document.getElementById('color-picker');
    const btnDraw = document.getElementById('btn-draw');
    const btnFill = document.getElementById('btn-fill');
    const btnErase = document.getElementById('btn-erase');
    const btnClear = document.getElementById('btn-clear');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnSaveProject = document.getElementById('btn-save-project');
    const btnLoadProject = document.getElementById('btn-load-project');
    const fileInput = document.getElementById('file-input');
    const btnDownload = document.getElementById('btn-download');
    const exportFormat = document.getElementById('export-format');
    const checkTransparent = document.getElementById('check-transparent');
    const btnReset = document.getElementById('btn-reset-view');

    // State
    let isDrawing = false, isPanning = false;
    let currentMode = 'draw';
    let scale = 1, translateX = 0, translateY = 0;
    let lastX = null, lastY = null;
    let startX, startY;
    let undoStack = [], redoStack = [];
    const maxHistory = 30;

    function init() {
        canvas.width = canvasSize; canvas.height = canvasSize;
        gridCanvas.width = canvasSize; gridCanvas.height = canvasSize;
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        canvas.style.backgroundColor = bgColorPicker.value;
        drawGrid();
        updateView();
        if (undoStack.length === 0) saveState();
    }

    function drawGrid() {
        const p = parseInt(gridSizeInput.value) || 8;
        const s = canvasSize / p;
        const opacity = gridOpacityInput.value;
        gridCtx.clearRect(0, 0, canvasSize, canvasSize);
        gridCtx.beginPath();
        gridCtx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        gridCtx.lineWidth = Math.max(0.5, 1 / scale);
        for (let i = 0; i <= canvasSize; i += s) {
            gridCtx.moveTo(i, 0); gridCtx.lineTo(i, canvasSize);
            gridCtx.moveTo(0, i); gridCtx.lineTo(canvasSize, i);
        }
        gridCtx.stroke();
    }

    function updateView() {
        container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function saveState() {
        undoStack.push(canvas.toDataURL());
        if (undoStack.length > maxHistory) undoStack.shift();
        redoStack = [];
    }

    function handleInput(e) {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvasSize / rect.width);
        const y = (e.clientY - rect.top) * (canvasSize / rect.height);
        const pCount = parseInt(gridSizeInput.value) || 8;
        const pSize = canvasSize / pCount;
        const gx = Math.floor(x / pSize) * pSize;
        const gy = Math.floor(y / pSize) * pSize;

        if (currentMode === 'draw') {
            ctx.fillStyle = colorPicker.value;
            if (e.shiftKey && lastX !== null) {
                const d = Math.max(Math.abs(gx-lastX), Math.abs(gy-lastY))/pSize;
                for(let i=0; i<=d; i++) {
                    const t = d===0?0:i/d;
                    ctx.fillRect(Math.floor((lastX+(gx-lastX)*t)/pSize)*pSize, Math.floor((lastY+(gy-lastY)*t)/pSize)*pSize, pSize, pSize);
                }
            } else { ctx.fillRect(gx, gy, pSize, pSize); }
            lastX = gx; lastY = gy;
        } else if (currentMode === 'erase') { ctx.clearRect(gx, gy, pSize, pSize); }
        else if (currentMode === 'fill') { floodFill(Math.floor(x), Math.floor(y), colorPicker.value); }
    }

    function floodFill(x, y, color) {
        const target = ctx.getImageData(x, y, 1, 1).data;
        const fill = { r: parseInt(color.slice(1,3),16), g: parseInt(color.slice(3,5),16), b: parseInt(color.slice(5,7),16) };
        if (target[0]===fill.r && target[1]===fill.g && target[2]===fill.b && target[3]===255) return;
        const data = ctx.getImageData(0,0,canvasSize,canvasSize);
        const pixels = data.data;
        const stack = [[x, y]];
        while(stack.length) {
            const [cx, cy] = stack.pop();
            const pos = (cy * canvasSize + cx) * 4;
            if (cx < 0 || cx >= canvasSize || cy < 0 || cy >= canvasSize) continue;
            if (pixels[pos]!==target[0] || pixels[pos+1]!==target[1] || pixels[pos+2]!==target[2] || pixels[pos+3]!==target[3]) continue;
            pixels[pos]=fill.r; pixels[pos+1]=fill.g; pixels[pos+2]=fill.b; pixels[pos+3]=255;
            stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
        ctx.putImageData(data, 0, 0);
    }

    // EVENT MAPPING
    gridCanvas.onmousedown = (e) => {
        if (isPanning || e.button === 1) { startX = e.clientX - translateX; startY = e.clientY - translateY; return; }
        isDrawing = true; handleInput(e);
    };
    window.onmousemove = (e) => {
        if (isPanning && startX !== undefined) { translateX = e.clientX - startX; translateY = e.clientY - startY; updateView(); return; }
        if (isDrawing) handleInput(e);
    };
    window.onmouseup = () => { if(isDrawing) saveState(); isDrawing = false; startX = undefined; lastX = null; lastY = null; };

    gridSizeInput.onchange = () => {
        if (parseInt(gridSizeInput.value) > 128) { if(!confirm("Large grids may crash your browser. Continue?")) { gridSizeInput.value=128; return; } }
        if (confirm("This will clear your work. Continue?")) { undoStack=[]; init(); }
    };

    gridOpacityInput.oninput = drawGrid;
    bgColorPicker.oninput = () => canvas.style.backgroundColor = bgColorPicker.value;
    btnReset.onclick = () => { scale=1; translateX=0; translateY=0; updateView(); drawGrid(); };
    btnClear.onclick = () => { if(confirm("Clear Canvas?")) { ctx.clearRect(0,0,canvasSize,canvasSize); saveState(); } };
    
    // Tools
    btnDraw.onclick = () => { currentMode='draw'; btnDraw.classList.add('active'); btnFill.classList.remove('active'); btnErase.classList.remove('active'); };
    btnFill.onclick = () => { currentMode='fill'; btnFill.classList.add('active'); btnDraw.classList.remove('active'); btnErase.classList.remove('active'); };
    btnErase.onclick = () => { currentMode='erase'; btnErase.classList.add('active'); btnDraw.classList.remove('active'); btnFill.classList.remove('active'); };

    // Undo/Redo
    btnUndo.onclick = () => {
        if (undoStack.length <= 1) return;
        redoStack.push(undoStack.pop());
        const img = new Image(); img.src = undoStack[undoStack.length - 1];
        img.onload = () => { ctx.clearRect(0,0,canvasSize,canvasSize); ctx.drawImage(img,0,0); };
    };
    btnRedo.onclick = () => {
        if (!redoStack.length) return;
        const data = redoStack.pop(); undoStack.push(data);
        const img = new Image(); img.src = data;
        img.onload = () => { ctx.clearRect(0,0,canvasSize,canvasSize); ctx.drawImage(img,0,0); };
    };

    // SAVE PROJECT
    btnSaveProject.onclick = () => {
        const data = { size: gridSizeInput.value, bg: bgColorPicker.value, art: canvas.toDataURL() };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pixel-project-${Date.now()}.json`;
        a.click();
    };

    // LOAD PROJECT
    btnLoadProject.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const data = JSON.parse(ev.target.result);
            gridSizeInput.value = data.size;
            bgColorPicker.value = data.bg;
            const img = new Image(); img.src = data.art;
            img.onload = () => { undoStack=[]; init(); ctx.drawImage(img,0,0); saveState(); };
        };
        reader.readAsText(file);
    };

    // DOWNLOAD IMAGE
    btnDownload.onclick = () => {
        const temp = document.createElement('canvas');
        temp.width = canvasSize; temp.height = canvasSize;
        const tCtx = temp.getContext('2d');
        if (!checkTransparent.checked || exportFormat.value === 'image/jpeg') {
            tCtx.fillStyle = bgColorPicker.value;
            tCtx.fillRect(0,0,canvasSize,canvasSize);
        }
        tCtx.drawImage(canvas, 0, 0);
        const a = document.createElement('a');
        a.download = `pixel-art.${exportFormat.value.split('/')[1]}`;
        a.href = temp.toDataURL(exportFormat.value);
        a.click();
    };

    // Zoom/Pan Listeners
    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) return; e.preventDefault();
        scale = Math.min(Math.max(scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.1), 20);
        updateView();
        drawGrid();
    }, { passive: false });

    window.addEventListener('keydown', (e) => { 
        if (e.code === 'Space') isPanning = true; 
        if (e.ctrlKey && e.key === 'z') btnUndo.click();
    });
    window.addEventListener('keyup', (e) => { if (e.code === 'Space') isPanning = false; });

    init(); // Start!
};