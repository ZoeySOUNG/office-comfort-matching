// Environmental data by floor and room, including average and standard deviation values
const dataByFloor = {
  25: {
    zones: ['room26', 'room27', 'room28'],
    ta: { mean: [25.1, 25.3, 24.4], std: [1.3, 1.4, 0.85] },
    lux: { mean: [25.1, 50.2, 75.3], std: [0.52, 0.95, 1.22] },
    spl: { mean: [43.5, 44.1, 45.0], std: [1.0, 0.85, 1.35] }
  },
  28: {
    zones: ['room47', 'room48', 'room49', 'room50'],
    ta: { mean: [27.3, 24.1, 23.7, 25.2], std: [1.2, 0.52, 1.03, 1.06] },
    lux: { mean: [77, 375, 450, 1], std: [92, 476, 465, 8.1] },
    spl: { mean: [49.5, 46.6, 45.0, 49.6], std: [7.99, 4.5, 1.65, 7.98] }
  },
  30: {
    zones: ['room30', 'room31', 'room46', 'room8'],
    ta: { mean: [24.2, 24.1, 24.6, 23.8], std: [0.9, 1.12, 1.12, 1.45] },
    lux: { mean: [149.8, 344.1, 23.2, 56.5], std: [1.4, 1.46, 1.1, 1.0] },
    spl: { mean: [45.1, 43.6, 45.2, 45.6], std: [0.6, 1.2, 0.9, 1.1] }
  }
};

// Green zones represent recommended comfort and stability ranges
const greenZones = {
  ta: { x0: 22, x1: 26, y0: 0.4, y1: 1.2, xFixed: [20, 28] },
  lux: { x0: 10, x1: 200, y0: 0.4, y1: 1.2, xFixed: [0, 300] },
  spl: { x0: 40, x1: 55, y0: 0.4, y1: 1.2, xFixed: [30, 60] }
};

// Assign each zone a color for consistent visual representation
const zoneColorMap = {};
const allZones = [...new Set(Object.values(dataByFloor).flatMap(f => f.zones))];
const colorPalette = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
  '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf'
];
allZones.forEach((zone, i) => {
  zoneColorMap[zone] = colorPalette[i % colorPalette.length];
});

let currentFloorData = {};
let plotRefs = {};

// Scatter plot with zone highlighting
function plotScatter(x, y, zones, container, title, xLabel, yLabel, rectRange, highlightZone = null, fixedXRange = null) {
  const trace = {
    x: x,
    y: y,
    mode: 'markers+text',
    type: 'scatter',
    text: zones,
    textposition: 'top center',
    marker: {
      size: 10,
      color: zones.map(z => z === highlightZone ? 'red' : zoneColorMap[z]),
      symbol: zones.map(z => z === highlightZone ? 'diamond' : 'circle')
    }
  };

  const layout = {
    title: title,
    xaxis: {
      title: xLabel,
      range: fixedXRange ?? [rectRange.x0 - 2, rectRange.x1 + 2]
    },
    yaxis: {
      title: yLabel,
      range: [0, 2]
    },
    margin: { t: 40, l: 50, r: 20, b: 40 },
    shapes: [
      {
        type: 'rect', xref: 'x', yref: 'paper', x0: rectRange.x0, x1: rectRange.x1,
        y0: 0, y1: 1, fillcolor: 'rgba(0, 200, 0, 0.1)', line: { width: 0 }
      },
      {
        type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: 0.4, y1: 0.4,
        line: { color: 'red', width: 1, dash: 'dash' }
      },
      {
        type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: 1.2, y1: 1.2,
        line: { color: 'red', width: 1, dash: 'dash' }
      }
    ],
    annotations: [
      { xref: 'paper', yref: 'y', x: -0.08, y: 1.8, text: '<b>Unstable ↑</b>', showarrow: false, font: { size: 12, color: 'gray' } },
      { xref: 'paper', yref: 'y', x: -0.08, y: 0.2, text: '<b>Stable ↓</b>', showarrow: false, font: { size: 12, color: 'gray' } }
    ]
  };

  Plotly.newPlot(container, [trace], layout).then(plot => {
    plotRefs[container] = plot;
  });
}

// NEW: Recommend rooms whose mean + SD fall inside green zone
function getRecommendedZone(data, variable) {
  const mean = data[variable].mean;
  const std = data[variable].std;
  const zones = data.zones;
  const range = greenZones[variable];

  const recommended = zones.filter((zone, index) => {
    const avg = mean[index];
    const sd = std[index];
    return avg >= range.x0 && avg <= range.x1 && sd >= range.y0 && sd <= range.y1;
  });

  return recommended.length > 0 ? recommended.join(', ') : 'None';
}

// UPDATED: Display only zones inside recommended green band
function updateTips(data) {
  document.getElementById('temp-tip').innerText = `GOOD: ${getRecommendedZone(data, 'ta')}`;
  document.getElementById('light-tip').innerText = `GOOD: ${getRecommendedZone(data, 'lux')}`;
  document.getElementById('noise-tip').innerText = `GOOD: ${getRecommendedZone(data, 'spl')}`;
}

// Switch floor and re-render all charts
function filterFloor(floor) {
  const data = dataByFloor[floor];
  currentFloorData = data;

  plotScatter(data.ta.mean, data.ta.std, data.zones, 'temp-chart', 'Temperature', 'Avg Temp (°C)', 'Stability (Std Dev)', greenZones.ta, null, greenZones.ta.xFixed);
  plotScatter(data.lux.mean, data.lux.std, data.zones, 'light-chart', 'Light', 'Avg Light (lux)', 'Stability (Std Dev)', greenZones.lux, null, greenZones.lux.xFixed);
  plotScatter(data.spl.mean, data.spl.std, data.zones, 'noise-chart', 'Noise', 'Avg Noise (dB)', 'Stability (Std Dev)', greenZones.spl, null, greenZones.spl.xFixed);

  updateTips(data);
  setTimeout(attachClickEvents, 300);
  updateLegend(data.zones);
}

// Attach click to points to highlight across charts
function attachClickEvents() {
  Object.entries(plotRefs).forEach(([id, plot]) => {
    plot.removeAllListeners('plotly_click');
    plot.on('plotly_click', data => {
      const zoneName = data.points[0].text;
      highlightZoneAcrossCharts(zoneName);
    });
  });
}

// Highlight selected zone on all three plots
function highlightZoneAcrossCharts(zoneLabel) {
  const data = currentFloorData;
  plotScatter(data.ta.mean, data.ta.std, data.zones, 'temp-chart',  'Temperature', 'Avg Temp (°C)', 'Std Dev', greenZones.ta, zoneLabel);
  plotScatter(data.lux.mean, data.lux.std, data.zones, 'light-chart', 'Light', 'Avg Light (lux)', 'Std Dev', greenZones.lux, zoneLabel);
  plotScatter(data.spl.mean, data.spl.std, data.zones, 'noise-chart', 'Noise', 'Avg Noise (dB)', 'Std Dev', greenZones.spl, zoneLabel);
}

// Update color legend
function updateLegend(zones) {
  const legend = document.getElementById('zone-legend');
  legend.innerHTML = '';
  zones.forEach(zone => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-color" style="background-color:${zoneColorMap[zone]}"></div>${zone}`;
    legend.appendChild(item);
  });
}

// Floor dropdown change handler
function handleDropdownChange() {
  const selectedFloor = document.getElementById('floor-select').value;
  filterFloor(parseInt(selectedFloor));
}

// Initial load
filterFloor(25);
