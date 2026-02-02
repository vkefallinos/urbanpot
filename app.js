// UrbanPot Mapper Application - Standalone Version
class UrbanPotMapper {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spaces = [];
        this.currentSpaceId = 0;
        this.currentPlants = [];
        
        // Drawing state
        this.drawingMode = null; // 'boundary' or 'container'
        this.drawingPoints = [];
        this.isDrawing = false;
        
        // View state
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Selected space for popup
        this.selectedSpace = null;
        
        this.initCanvas();
        this.initEventListeners();
        this.updateSubstrateTotal();
        this.render();
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    initEventListeners() {
        // Drawing tool buttons
        document.getElementById('drawBoundaryBtn').addEventListener('click', () => {
            this.startDrawing('boundary');
        });

        document.getElementById('drawContainerBtn').addEventListener('click', () => {
            this.startDrawing('container');
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });

        // Map controls
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.zoom(1.2);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.zoom(0.8);
        });

        document.getElementById('resetViewBtn').addEventListener('click', () => {
            this.resetView();
        });

        // Add plant button
        document.getElementById('addPlantBtn').addEventListener('click', () => {
            this.addPlant();
        });

        // Substrate percentage inputs
        const substrateInputs = ['soilPercent', 'compostPercent', 'perlitePercent', 'vermiculitePercent'];
        substrateInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updateSubstrateTotal();
            });
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startDrawing(mode) {
        this.drawingMode = mode;
        this.isDrawing = true;
        this.drawingPoints = [];
        this.closePopup();
        
        const instructions = document.getElementById('drawingInstructions');
        if (mode === 'boundary') {
            instructions.textContent = 'Click to add points, double-click to finish polygon';
        } else {
            instructions.textContent = 'Click and drag to create a rectangle';
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.drawingMode === 'container' && this.isDrawing) {
            this.drawingPoints = [this.screenToWorld(x, y)];
        } else if (!this.isDrawing) {
            this.isDragging = true;
            this.dragStartX = x;
            this.dragStartY = y;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging) {
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.dragStartX = x;
            this.dragStartY = y;
            this.render();
        } else if (this.drawingMode === 'container' && this.isDrawing && this.drawingPoints.length === 1) {
            // Preview rectangle while dragging
            const worldPos = this.screenToWorld(x, y);
            this.render();
            this.drawRectanglePreview(this.drawingPoints[0], worldPos);
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = this.isDrawing ? 'crosshair' : 'default';
        } else if (this.drawingMode === 'container' && this.isDrawing && this.drawingPoints.length === 1) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const worldPos = this.screenToWorld(x, y);
            
            // Complete the rectangle
            this.drawingPoints.push(worldPos);
            this.finishDrawing();
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldPos = this.screenToWorld(x, y);
        
        if (this.drawingMode === 'boundary' && this.isDrawing) {
            this.drawingPoints.push(worldPos);
            this.render();
        } else if (!this.isDrawing) {
            // Check if clicked on a space
            this.checkSpaceClick(worldPos);
        }
    }

    handleDoubleClick(e) {
        if (this.drawingMode === 'boundary' && this.isDrawing && this.drawingPoints.length >= 3) {
            this.finishDrawing();
        }
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.scale + this.offsetX,
            y: worldY * this.scale + this.offsetY
        };
    }

    finishDrawing() {
        if (this.drawingPoints.length < 2) {
            alert('Not enough points to create a shape');
            this.cancelDrawing();
            return;
        }

        const spaceData = this.collectSpaceData(this.drawingMode);
        spaceData.id = ++this.currentSpaceId;
        spaceData.type = this.drawingMode;
        spaceData.points = [...this.drawingPoints];
        this.spaces.push(spaceData);

        this.updateSpacesList();
        this.cancelDrawing();
        
        if (this.drawingMode === 'container') {
            this.clearContainerForm();
        }
        
        this.render();
    }

    cancelDrawing() {
        this.drawingMode = null;
        this.isDrawing = false;
        this.drawingPoints = [];
        this.canvas.style.cursor = 'default';
        document.getElementById('drawingInstructions').textContent = '';
    }

    collectSpaceData(type) {
        const data = {
            plants: [...this.currentPlants],
            createdAt: new Date().toISOString()
        };

        if (type === 'container') {
            data.name = document.getElementById('containerName').value || 'Unnamed Container';
            data.containerType = document.getElementById('containerType').value;
            data.depth = document.getElementById('containerDepth').value || 'Not specified';
            
            data.substrate = {
                soil: document.getElementById('soilPercent').value,
                compost: document.getElementById('compostPercent').value,
                perlite: document.getElementById('perlitePercent').value,
                vermiculite: document.getElementById('vermiculitePercent').value
            };
        } else {
            data.name = 'Garden Boundary #' + this.currentSpaceId;
        }

        return data;
    }

    checkSpaceClick(worldPos) {
        // Check spaces in reverse order (top to bottom)
        for (let i = this.spaces.length - 1; i >= 0; i--) {
            const space = this.spaces[i];
            if (this.isPointInSpace(worldPos, space)) {
                this.showPopup(space, worldPos);
                return;
            }
        }
        this.closePopup();
    }

    isPointInSpace(point, space) {
        if (space.type === 'container' && space.points.length === 2) {
            const [p1, p2] = space.points;
            const minX = Math.min(p1.x, p2.x);
            const maxX = Math.max(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
        } else if (space.type === 'boundary') {
            // Point in polygon test
            return this.pointInPolygon(point, space.points);
        }
        return false;
    }

    pointInPolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    showPopup(space, worldPos) {
        this.selectedSpace = space;
        this.closePopup();
        
        const screenPos = this.worldToScreen(worldPos.x, worldPos.y);
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        popup.id = 'spacePopup';
        popup.style.left = (screenPos.x + 10) + 'px';
        popup.style.top = (screenPos.y + 10) + 'px';
        
        popup.innerHTML = this.createPopupContent(space);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'popup-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => this.closePopup();
        popup.appendChild(closeBtn);
        
        this.canvas.parentElement.appendChild(popup);
        this.render();
    }

    closePopup() {
        const popup = document.getElementById('spacePopup');
        if (popup) {
            popup.remove();
        }
        this.selectedSpace = null;
        this.render();
    }

    createPopupContent(spaceData) {
        let content = `<h3>${spaceData.name}</h3>`;
        
        if (spaceData.containerType) {
            content += `<p><strong>Type:</strong> ${spaceData.containerType.replace(/-/g, ' ')}</p>`;
            content += `<p><strong>Depth:</strong> ${spaceData.depth} cm</p>`;
            
            if (spaceData.substrate) {
                content += `<p><strong>Substrate:</strong></p>`;
                content += `<ul>`;
                content += `<li>Soil: ${spaceData.substrate.soil}%</li>`;
                content += `<li>Compost: ${spaceData.substrate.compost}%</li>`;
                content += `<li>Perlite: ${spaceData.substrate.perlite}%</li>`;
                content += `<li>Vermiculite: ${spaceData.substrate.vermiculite}%</li>`;
                content += `</ul>`;
            }
        }
        
        if (spaceData.plants && spaceData.plants.length > 0) {
            content += `<p><strong>Plants (${spaceData.plants.length}):</strong></p>`;
            content += `<ul>`;
            spaceData.plants.forEach(plant => {
                content += `<li>${plant.name}`;
                if (plant.variety) content += ` (${plant.variety})`;
                content += ` - Qty: ${plant.quantity}</li>`;
            });
            content += `</ul>`;
        }
        
        return content;
    }

    zoom(factor) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.offsetX = centerX - (centerX - this.offsetX) * factor;
        this.offsetY = centerY - (centerY - this.offsetY) * factor;
        this.scale *= factor;
        
        this.render();
    }

    resetView() {
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
        this.scale = 1;
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#e8f4f8';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw all spaces
        this.spaces.forEach(space => {
            this.drawSpace(space, space === this.selectedSpace);
        });
        
        // Draw current drawing
        if (this.isDrawing && this.drawingPoints.length > 0) {
            this.drawCurrentDrawing();
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gridSize = 50 * this.scale;
        
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        
        // Vertical lines
        const startX = this.offsetX % gridSize;
        for (let x = startX; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        const startY = this.offsetY % gridSize;
        for (let y = startY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawSpace(space, highlight = false) {
        if (!space.points || space.points.length < 2) return;
        
        const ctx = this.ctx;
        const screenPoints = space.points.map(p => this.worldToScreen(p.x, p.y));
        
        // Set style based on type and highlight
        if (space.type === 'container') {
            ctx.fillStyle = highlight ? 'rgba(52, 152, 219, 0.5)' : 'rgba(52, 152, 219, 0.3)';
            ctx.strokeStyle = '#3498db';
        } else {
            ctx.fillStyle = highlight ? 'rgba(46, 204, 113, 0.5)' : 'rgba(46, 204, 113, 0.3)';
            ctx.strokeStyle = '#2ecc71';
        }
        ctx.lineWidth = highlight ? 3 : 2;
        
        // Draw shape
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        screenPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        const center = this.getShapeCenter(screenPoints);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(space.name, center.x, center.y);
    }

    drawCurrentDrawing() {
        if (this.drawingPoints.length === 0) return;
        
        const ctx = this.ctx;
        const screenPoints = this.drawingPoints.map(p => this.worldToScreen(p.x, p.y));
        
        ctx.strokeStyle = '#e74c3c';
        ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        screenPoints.forEach(p => ctx.lineTo(p.x, p.y));
        
        if (this.drawingMode === 'boundary') {
            ctx.stroke();
            
            // Draw points
            screenPoints.forEach(p => {
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    drawRectanglePreview(start, end) {
        const ctx = this.ctx;
        const p1 = this.worldToScreen(start.x, start.y);
        const p2 = this.worldToScreen(end.x, end.y);
        
        ctx.strokeStyle = '#e74c3c';
        ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.fill();
        ctx.stroke();
    }

    getShapeCenter(points) {
        const sum = points.reduce((acc, p) => ({x: acc.x + p.x, y: acc.y + p.y}), {x: 0, y: 0});
        return {x: sum.x / points.length, y: sum.y / points.length};
    }

    addPlant() {
        const name = document.getElementById('plantName').value.trim();
        if (!name) {
            alert('Please enter a plant name');
            return;
        }

        const plant = {
            name: name,
            variety: document.getElementById('plantVariety').value.trim(),
            quantity: document.getElementById('plantQuantity').value || 1,
            spacing: document.getElementById('plantSpacing').value || 'Not specified',
            date: document.getElementById('plantDate').value || 'Not specified',
            id: ++this.currentSpaceId * 1000 + this.currentPlants.length
        };

        this.currentPlants.push(plant);
        this.updatePlantList();
        this.clearPlantForm();
    }

    updatePlantList() {
        const plantList = document.getElementById('plantList');
        
        if (this.currentPlants.length === 0) {
            plantList.innerHTML = '<p style="color: #999; font-size: 0.9rem; margin-top: 0.5rem;">No plants added yet</p>';
            return;
        }

        plantList.innerHTML = this.currentPlants.map(plant => `
            <div class="plant-item">
                <h4>🌿 ${plant.name}</h4>
                ${plant.variety ? `<p>Variety: ${plant.variety}</p>` : ''}
                <p>Quantity: ${plant.quantity}</p>
                <p>Spacing: ${plant.spacing} cm</p>
                <p>Date: ${plant.date}</p>
                <button onclick="mapper.removePlant(${plant.id})">Remove</button>
            </div>
        `).join('');
    }

    removePlant(plantId) {
        this.currentPlants = this.currentPlants.filter(p => p.id !== plantId);
        this.updatePlantList();
    }

    updateSpacesList() {
        const spacesList = document.getElementById('spacesList');
        
        if (this.spaces.length === 0) {
            spacesList.innerHTML = '<p style="color: #999; font-size: 0.9rem;">No spaces created yet</p>';
            return;
        }

        spacesList.innerHTML = this.spaces.map(space => {
            const plantCount = space.plants ? space.plants.length : 0;
            const typeLabel = space.type === 'boundary' ? 'Boundary' : 'Container';
            
            return `
                <div class="space-item" onclick="mapper.focusSpace(${space.id})">
                    <h4>${typeLabel}: ${space.name}</h4>
                    ${space.containerType ? `<p>Type: ${space.containerType.replace(/-/g, ' ')}</p>` : ''}
                    <p>🌱 ${plantCount} plant(s)</p>
                    <p>Created: ${new Date(space.createdAt).toLocaleDateString()}</p>
                </div>
            `;
        }).join('');
    }

    focusSpace(spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space && space.points && space.points.length > 0) {
            // Calculate bounding box
            const xs = space.points.map(p => p.x);
            const ys = space.points.map(p => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            
            // Center on space
            this.offsetX = this.canvas.width / 2 - centerX * this.scale;
            this.offsetY = this.canvas.height / 2 - centerY * this.scale;
            
            this.render();
            
            // Show popup
            const worldCenter = {x: centerX, y: centerY};
            this.showPopup(space, worldCenter);
        }
    }

    updateSubstrateTotal() {
        const soil = parseInt(document.getElementById('soilPercent').value) || 0;
        const compost = parseInt(document.getElementById('compostPercent').value) || 0;
        const perlite = parseInt(document.getElementById('perlitePercent').value) || 0;
        const vermiculite = parseInt(document.getElementById('vermiculitePercent').value) || 0;
        
        const total = soil + compost + perlite + vermiculite;
        const totalElement = document.getElementById('substrateTotal');
        totalElement.textContent = total;
        
        if (total === 100) {
            totalElement.style.color = '#2ecc71';
        } else {
            totalElement.style.color = '#e74c3c';
        }
    }

    clearPlantForm() {
        document.getElementById('plantName').value = '';
        document.getElementById('plantVariety').value = '';
        document.getElementById('plantQuantity').value = 1;
        document.getElementById('plantSpacing').value = '';
        document.getElementById('plantDate').value = '';
    }

    clearContainerForm() {
        document.getElementById('containerName').value = '';
        document.getElementById('containerType').selectedIndex = 0;
        document.getElementById('containerDepth').value = '';
        this.currentPlants = [];
        this.updatePlantList();
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all drawn spaces? This cannot be undone.')) {
            this.spaces = [];
            this.currentSpaceId = 0;
            this.updateSpacesList();
            this.closePopup();
            this.render();
        }
    }
}

// Initialize the application when the page loads
let mapper;
document.addEventListener('DOMContentLoaded', () => {
    mapper = new UrbanPotMapper();
});
