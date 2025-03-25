// script.js

mapboxgl.accessToken = 'pk.eyJ1IjoibWFqZWVkc3ViZXJ1IiwiYSI6ImNtNzFyeHI5aTAydmwyanIzMzY2ZzZpYXEifQ.Q5ZSoK62bL1NYKt-HEyDiw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-9.4295, 6.4281],
  zoom: 6
});

let currentFactionFilter = null;
let currentCountyFilter = null;

let selectedFaction = null;
let selectedCounty = null;

function applyFilters() {
  const filters = ['all'];

  if (selectedFaction && selectedFaction !== 'ALL') {
    filters.push(['==', ['get', 'warring_faction'], selectedFaction]);
  }

  if (selectedCounty && selectedCounty !== 'ALL') {
    filters.push(['==', ['get', 'county'], selectedCounty]);
  }

  map.setFilter('unclustered-point', filters.length > 1 ? filters : null);
}

function filterMarkers(faction) {
  selectedFaction = faction;
  applyFilters();
}



function filterByCounty(county) {
  selectedCounty = county;
  applyFilters();
}


// Onboarding stegvis guide
document.addEventListener("DOMContentLoaded", function () {
  const steps = [
    "This is a map documenting each massacre between 1979 - 2003.",
    "Each dot represents a massacre and the warring faction behind it.",
    "Click on a dot to get more information regarding the massacre."
  ];

  let currentStep = 0;
  const stepContainer = document.getElementById("onboarding-step");
  const stepText = document.getElementById("onboarding-text");
  const nextBtn = document.getElementById("onboarding-next");
  const skipBtn = document.getElementById("onboarding-skip");

  function showStep(index) {
    stepText.textContent = steps[index];
    stepContainer.classList.remove("hidden");
    stepContainer.classList.add("visible");
  }

  nextBtn.addEventListener("click", () => {
    currentStep++;
    if (currentStep < steps.length) {
      showStep(currentStep);
    } else {
      stepContainer.classList.add("hidden");
      stepContainer.classList.remove("visible");
      localStorage.setItem("onboardingDone", "true");
    }
  });

  skipBtn.addEventListener("click", () => {
    stepContainer.classList.add("hidden");
    stepContainer.classList.remove("visible");
    localStorage.setItem("onboardingDone", "true");
  });

  if (!localStorage.getItem("onboardingDone")) {
    showStep(currentStep);
  }
});

map.on('load', () => {
  map.addSource('events', {
    type: 'geojson',
    data: 'markers.geojson',
    cluster: false
  });

  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'events',
    paint: {
      'circle-color': [
        'match',
        ['get', 'warring_faction'],
        'NPFL', '#ff6666',
        'ULIMO-K', '#6666ff',
        'LURD', '#66cc66',
        'ULIMO', '#cc66cc',
        'ULIMO-J', '#ffcc66',
        'INPFL', '#999999',
        'LPC', '#ffff66',
        'GOL', '#996633',
        '#ff6600'
      ],
      'circle-radius': 6,
      'circle-opacity': 0.8
    }
  });

  map.on('mouseenter', 'unclustered-point', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    const props = e.features[0].properties;
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${props.name}</strong><br>${props.date}<br>${props.warring_faction}<br>${props.casualties || ''}`)
      .addTo(map);
    map.once('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  });
});

map.on('click', 'unclustered-point', (e) => {
    const props = e.features[0].properties;
  
    // Fyll innehållet i sidopanelen
    const sidebarContent = document.getElementById("sidebar-content");
    sidebarContent.innerHTML = `
      <p><strong>${props.name}</strong></p>
      <p>Date: ${props.date}</p>
      <p>Faction: ${props.warring_faction}</p>
      <p>Casualties: ${props.casualties || 'Unknown'}</p>
    `;
  
    // Visa sidopanelen
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.add("open");
  });



// ========================
// COUNTY-FILTER
// ========================

// Få referens till select-elementet
const countySelect = document.getElementById("county-select");

// Lägg till en lyssnare för när användaren väljer ett county
countySelect.addEventListener("change", function () {
  const selectedCounty = this.value;

  if (selectedCounty === "ALL") {
    map.setFilter("unclustered-point", null);
  } else {
    map.setFilter("unclustered-point", ["==", ["get", "county"], selectedCounty]);
  }
});


// Toggle filtermeny
function toggleFilters() {
  const el = document.getElementById('filter-options');
  el.classList.toggle('hidden');
}

// Infopopup
document.addEventListener("DOMContentLoaded", function () {
  const infoBtn = document.getElementById("info-button");
  const infoPopup = document.getElementById("info-popup");
  const closeInfo = document.getElementById("close-info");

  infoBtn.addEventListener("click", function () {
    infoPopup.classList.toggle("visible");
    infoPopup.classList.toggle("hidden");
  });

  closeInfo.addEventListener("click", function () {
    infoPopup.classList.add("hidden");
    infoPopup.classList.remove("visible");
  });
});

// Overlay
function closeOverlay() {
  const overlay = document.getElementById("overlay");
  const dontShowAgain = document.getElementById("dontShowAgain");
  if (dontShowAgain.checked) {
    localStorage.setItem("hideOverlay", "true");
  }
  overlay.classList.add("hidden");
}

if (localStorage.getItem("hideOverlay") === "true") {
  document.getElementById("overlay").classList.add("hidden");
}

// sidebar
function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.remove("open");
} 

// Timeline
const timeline = document.getElementById("timeline");
timeline.addEventListener("input", function (e) {
  const year = e.target.value;
  document.getElementById("selectedYear").textContent = year;
  map.setFilter("unclustered-point", ["==", ["get", "date"], year]);
});

function toggleFactionFilters() {
    const factionOptions = document.getElementById('filter-options');
    const arrow = document.getElementById('faction-arrow');
    factionOptions.classList.toggle('hidden');
    arrow.textContent = factionOptions.classList.contains('hidden') ? '▼' : '▲';
  }
  
  function toggleCountyFilters() {
    const countyOptions = document.getElementById('county-filter-options');
    const arrow = document.getElementById('county-arrow');
    countyOptions.classList.toggle('hidden');
    arrow.textContent = countyOptions.classList.contains('hidden') ? '▼' : '▲';
  }
  