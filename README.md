# 🌱 UrbanPot Mapper

A web-based application designed for urban gardeners, landscape architects, and hobbyists to visualize and manage their gardening spaces.

## Features

- **🗺️ Real-World Map Integration**: Interactive maps powered by OpenStreetMap and Leaflet.js
- **📐 Boundary Drawing**: Draw garden space boundaries using polygon tools
- **📦 Container Designer**: Create and design custom planting containers with detailed specifications
- **🌿 Plant Placement Tracking**: Add and manage plant information with varieties, quantities, and spacing
- **🏺 Substrate Composition**: Track detailed soil composition with percentage-based mixing ratios
- **📊 Data Management**: Store and visualize all garden space information in an organized interface

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Node.js and npm (optional, for running a local server)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vkefallinos/urbanpot.git
cd urbanpot
```

2. Open the application:
   - **Option 1**: Simply open `index.html` in your web browser
   - **Option 2**: Use a local server:
     ```bash
     npm install
     npm start
     ```

## Usage

### Drawing Garden Boundaries
1. Click the "📐 Draw Boundary" button
2. Click on the map to place boundary points
3. Double-click to complete the boundary polygon

### Creating Containers
1. Fill out the container information in the sidebar:
   - Container name
   - Container type (raised bed, pot, planter box, etc.)
   - Depth in centimeters
2. Set the substrate composition (ensure it totals 100%)
3. Add any plants you want to track
4. Click "📦 Draw Container" and draw a rectangle on the map

### Adding Plants
1. Enter plant details:
   - Plant name
   - Variety (optional)
   - Quantity
   - Spacing between plants
   - Planting date
2. Click "🌿 Add Plant" to add to the current container

### Managing Spaces
- View all created spaces in the "Garden Spaces" section
- Click on any space to zoom to it and view details
- Click on markers on the map to see detailed popups
- Use "🗑️ Clear All" to remove all spaces (with confirmation)

## Technology Stack

- **HTML5**: Structure and markup
- **CSS3**: Styling and responsive design
- **JavaScript (ES6+)**: Application logic and interactivity
- **Leaflet.js**: Interactive mapping library
- **Leaflet.Draw**: Drawing tools for shapes and boundaries
- **OpenStreetMap**: Map tiles and geographic data

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- OpenStreetMap contributors for map data
- Leaflet.js for the mapping library
- Leaflet.Draw for drawing functionality