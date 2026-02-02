// UrbanPot Mapper Application
class UrbanPotMapper {
    constructor() {
        this.map = null;
        this.drawnItems = new L.FeatureGroup();
        this.currentDrawControl = null;
        this.spaces = [];
        this.currentSpaceId = 0;
        this.currentPlants = [];
        
        this.initMap();
        this.initEventListeners();
        this.updateSubstrateTotal();
    }

    initMap() {
        // Initialize map centered on a default location (can be changed)
        this.map = L.map('map').setView([40.7128, -74.0060], 18); // New York City

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 22,
            maxNativeZoom: 19
        }).addTo(this.map);

        // Add drawn items layer to map
        this.drawnItems.addTo(this.map);

        // Add scale control
        L.control.scale().addTo(this.map);
    }

    initEventListeners() {
        // Drawing tool buttons
        document.getElementById('drawBoundaryBtn').addEventListener('click', () => {
            this.startDrawing('polygon');
        });

        document.getElementById('drawContainerBtn').addEventListener('click', () => {
            this.startDrawing('rectangle');
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAll();
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

        // Map draw events
        this.map.on(L.Draw.Event.CREATED, (e) => {
            this.handleDrawCreated(e);
        });
    }

    startDrawing(type) {
        // Remove existing draw control if any
        if (this.currentDrawControl) {
            this.map.removeControl(this.currentDrawControl);
        }

        // Create new draw control based on type
        const drawOptions = {
            draw: {
                polyline: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polygon: type === 'polygon' ? {
                    shapeOptions: {
                        color: '#2ecc71',
                        fillOpacity: 0.3
                    }
                } : false,
                rectangle: type === 'rectangle' ? {
                    shapeOptions: {
                        color: '#3498db',
                        fillOpacity: 0.3
                    }
                } : false
            },
            edit: {
                featureGroup: this.drawnItems,
                remove: true
            }
        };

        this.currentDrawControl = new L.Control.Draw(drawOptions);
        this.map.addControl(this.currentDrawControl);

        // Automatically start drawing
        if (type === 'polygon') {
            new L.Draw.Polygon(this.map, drawOptions.draw.polygon).enable();
        } else if (type === 'rectangle') {
            new L.Draw.Rectangle(this.map, drawOptions.draw.rectangle).enable();
        }
    }

    handleDrawCreated(e) {
        const layer = e.layer;
        const type = e.layerType;
        
        // Get current form data
        const spaceData = this.collectSpaceData(type);
        
        // Store space data
        spaceData.id = ++this.currentSpaceId;
        spaceData.layer = layer;
        spaceData.type = type;
        this.spaces.push(spaceData);

        // Add layer to map
        this.drawnItems.addLayer(layer);

        // Create popup
        const popupContent = this.createPopupContent(spaceData);
        layer.bindPopup(popupContent);

        // Update spaces list
        this.updateSpacesList();

        // Clear form if it was a container
        if (type === 'rectangle') {
            this.clearContainerForm();
        }
    }

    collectSpaceData(type) {
        const data = {
            plants: [...this.currentPlants],
            createdAt: new Date().toISOString()
        };

        if (type === 'rectangle') {
            // Container data
            data.name = document.getElementById('containerName').value || 'Unnamed Container';
            data.containerType = document.getElementById('containerType').value;
            data.depth = document.getElementById('containerDepth').value || 'Not specified';
            
            // Substrate composition
            data.substrate = {
                soil: document.getElementById('soilPercent').value,
                compost: document.getElementById('compostPercent').value,
                perlite: document.getElementById('perlitePercent').value,
                vermiculite: document.getElementById('vermiculitePercent').value
            };
        } else {
            // Boundary data
            data.name = 'Garden Boundary #' + (this.currentSpaceId + 1);
            data.type = 'boundary';
        }

        return data;
    }

    createPopupContent(spaceData) {
        let content = `<div class="popup-content">`;
        content += `<h3>${spaceData.name}</h3>`;
        
        if (spaceData.containerType) {
            content += `<p><strong>Type:</strong> ${spaceData.containerType.replace('-', ' ')}</p>`;
            content += `<p><strong>Depth:</strong> ${spaceData.depth} cm</p>`;
            
            if (spaceData.substrate) {
                content += `<p><strong>Substrate:</strong></p>`;
                content += `<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">`;
                content += `<li>Soil: ${spaceData.substrate.soil}%</li>`;
                content += `<li>Compost: ${spaceData.substrate.compost}%</li>`;
                content += `<li>Perlite: ${spaceData.substrate.perlite}%</li>`;
                content += `<li>Vermiculite: ${spaceData.substrate.vermiculite}%</li>`;
                content += `</ul>`;
            }
        }
        
        if (spaceData.plants && spaceData.plants.length > 0) {
            content += `<p><strong>Plants (${spaceData.plants.length}):</strong></p>`;
            content += `<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">`;
            spaceData.plants.forEach(plant => {
                content += `<li>${plant.name}`;
                if (plant.variety) content += ` (${plant.variety})`;
                content += ` - Qty: ${plant.quantity}</li>`;
            });
            content += `</ul>`;
        }
        
        content += `</div>`;
        return content;
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
            id: Date.now()
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
            const typeLabel = space.type === 'polygon' ? 'Boundary' : 'Container';
            
            return `
                <div class="space-item" onclick="mapper.focusSpace(${space.id})">
                    <h4>${typeLabel}: ${space.name}</h4>
                    ${space.containerType ? `<p>Type: ${space.containerType.replace('-', ' ')}</p>` : ''}
                    <p>🌱 ${plantCount} plant(s)</p>
                    <p>Created: ${new Date(space.createdAt).toLocaleDateString()}</p>
                </div>
            `;
        }).join('');
    }

    focusSpace(spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space && space.layer) {
            // Zoom to the layer
            this.map.fitBounds(space.layer.getBounds(), {
                padding: [50, 50],
                maxZoom: 20
            });
            
            // Open popup
            space.layer.openPopup();
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
        
        // Visual feedback if total is not 100
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
            this.drawnItems.clearLayers();
            this.spaces = [];
            this.currentSpaceId = 0;
            this.updateSpacesList();
        }
    }
}

// Initialize the application when the page loads
let mapper;
document.addEventListener('DOMContentLoaded', () => {
    mapper = new UrbanPotMapper();
});
