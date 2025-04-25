// script.js

mapboxgl.accessToken = 'pk.eyJ1IjoibWFqZWVkc3ViZXJ1IiwiYSI6ImNtNzFyeHI5aTAydmwyanIzMzY2ZzZpYXEifQ.Q5ZSoK62bL1NYKt-HEyDiw';



document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('onboardingOverlay');
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.getElementById('nextSlide');
    const prevBtn = document.getElementById('prevSlide');
    const startBtn = document.getElementById('startExploringBtn');
    const hideCheckbox = document.getElementById('hideOverlayCheckbox');
    const helpIcon = document.getElementById('helpIcon');
  
    let currentSlide = 0;
  
    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle('hidden', i !== index);
      });
      prevBtn.disabled = index === 0;
      nextBtn.classList.toggle('hidden', index === slides.length - 1);
      startBtn.classList.toggle('hidden', index !== slides.length - 1);
    };
  
    const closeOverlay = () => {
      if (hideCheckbox.checked) {
        localStorage.setItem('hideOnboarding', 'true');
      }
      overlay.classList.add('hidden');
    };
  
    // Start exploring button
    startBtn.addEventListener('click', closeOverlay);
  
    // Slide navigation
    nextBtn.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        showSlide(currentSlide);
      }
    });
  
    prevBtn.addEventListener('click', () => {
      if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
      }
    });
  
    // Show overlay only if not hidden before
    const shouldHide = localStorage.getItem('hideOnboarding');
    if (!shouldHide) {
      overlay.classList.remove('hidden');
      showSlide(currentSlide);
    }
  
    // Help icon shows overlay again
    helpIcon.addEventListener('click', () => {
      overlay.classList.remove('hidden');
      currentSlide = 0;
      showSlide(currentSlide);
    });
  });
  

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

  // GA tracking – loggar vilket filter som används
  gtag("event", "filter_faction", {
    event_category: "Filter",
    event_label: faction,
    value: 1
  });
}


function filterByCounty(county) {
  selectedCounty = county;
  applyFilters();

  // GA tracking – loggar vilket county som valts
  gtag("event", "filter_county", {
    event_category: "Filter",
    event_label: county,
    value: 1
  });
}


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

  // GA tracking – loggar vilken markör som klickats
  gtag("event", "marker_click", {
    event_category: "Map",
    event_label: `${props.name} (${props.warring_faction})`,
    value: props.casualties ? parseInt(props.casualties) : 0
  });
  
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

  const storySteps = [
    {
      coords: [ -10.8, 6.3 ],
      date: "Augusti 1990",
      location: "Buchanan",
      description: "NPFL attackerade staden. Minst 200 döda."
    },
    {
      coords: [ -9.6, 7.0 ],
      date: "Juni 1993",
      location: "Gbarnga",
      description: "ULIMO-K intog området. Många civila flydde."
    },
    {
      coords: [ -10.0, 6.9 ],
      date: "April 1996",
      location: "Monrovia",
      description: "Våldsam sammandrabbning mellan flera fraktioner."
    }
  ];
  
  
  let currentStep = 0;
  
  const storyBtn = document.getElementById('startStoryMode');
  const storyBox = document.getElementById('storyBox');
  const storyDate = document.getElementById('storyDate');
  const storyLocation = document.getElementById('storyLocation');
  const storyDescription = document.getElementById('storyDescription');
  const nextStory = document.getElementById('nextStory');

  function showStoryStep(step) {
    const { coords, date, location, description } = step;

  
    // Flytta kartan
    map.flyTo({ center: coords, zoom: 8 });
  
    // Visa popup
    new mapboxgl.Popup()
      .setLngLat(coords)
      .setHTML(`<strong>${location}</strong><br>${date}<br>${description}`)
      .addTo(map);
  
    // Visa sidopanel
    document.getElementById("sidebar-content").innerHTML = `
      <p><strong>${location}</strong></p>
      <p>Date: ${date}</p>
      <p>${description}</p>
    `;
    document.getElementById("sidebar").classList.add("open");
  
    // Storybox
    storyDate.textContent = date;
    storyLocation.textContent = location;
    storyDescription.textContent = description;
    storyBox.classList.remove('hidden');
  }

  storyBtn.addEventListener('click', () => {
    currentStep = 0;
    showStoryStep(storySteps[currentStep]);
  });
  
  nextStory.addEventListener('click', () => {
    currentStep++;
    if (currentStep < storySteps.length) {
      showStoryStep(storySteps[currentStep]);
    } else {
      storyBox.classList.add('hidden');
      document.getElementById("sidebar").classList.remove("open");
    }
  });
  
  





// ========================
// COUNTY-FILTER
// ========================

// Få referens till select-elementet
// const countySelect = document.getElementById("county-select");

// Lägg till en lyssnare för när användaren väljer ett county
// countySelect.addEventListener("change", function () {
//  const selectedCounty = this.value;

 // if (selectedCounty === "ALL") {
//    map.setFilter("unclustered-point", null);
//  } else {
//    map.setFilter("unclustered-point", ["==", ["get", "county"], selectedCounty]);
 // }
// });


// Toggle filtermeny
function toggleFilters() {
  const el = document.getElementById('filter-options');
  el.classList.toggle('hidden');
}

// Infopopup
document.getElementById("infoBtn").addEventListener("click", function() {
    document.getElementById("info-popup").classList.toggle("active"); // Toggles visibility
  });
  
  document.getElementById("close-info").addEventListener("click", function() {
    document.getElementById("info-popup").classList.remove("active"); // Closes popup
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
  
  document.getElementById('closeDataOverlay').addEventListener('click', () => {
    document.getElementById('dataOverlay').classList.add('hidden');
  });
  
  function drawCasualtyChart() {
    console.log("Ritar cirkeldiagrammet");
    const canvas = document.getElementById("casualtyChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Canvas context kunde inte hämtas.");
      return;
    }
  
    // Rensa tidigare innehåll
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    const data = [
      { label: "NPFL", value: 400, color: "#ff6666" },
      { label: "ULIMO-K", value: 250, color: "#6666ff" },
      { label: "LURD", value: 150, color: "#66cc66" },
      { label: "ULIMO", value: 100, color: "#cc66cc" },
    ];
  
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = 0;
  
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
  
    data.forEach((segment) => {
      const sliceAngle = (segment.value / total) * 2 * Math.PI;
      const midAngle = startAngle + sliceAngle / 2;
  
      // Rita sektorn
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
  
      // Textplacering
      const labelX = centerX + Math.cos(midAngle) * (radius * 0.6);
      const labelY = centerY + Math.sin(midAngle) * (radius * 0.6);
  
      // Etikett
      ctx.fillStyle = "black";
      ctx.font = "bold 14px Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${segment.label} – ${segment.value}`, labelX, labelY);
  
      startAngle += sliceAngle;
    });
  }
  
  // Kör funktionen varje gång overlayen öppnas
  document.getElementById('dataIcon').addEventListener('click', () => {
    document.getElementById('dataOverlay').classList.remove('hidden');
    drawCasualtyChart();
  
    // GA tracking – när användaren öppnar "The War in Data"
    gtag("event", "open_data_overlay", {
      event_category: "Overlay",
      event_label: "The War in Data",
      value: 1
    });
  });
  
   
  
  