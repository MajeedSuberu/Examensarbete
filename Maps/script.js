// Lägg in din API-nyckel från Mapbox här
mapboxgl.accessToken = 'pk.eyJ1IjoibWFqZWVkc3ViZXJ1IiwiYSI6ImNtNzFyeHI5aTAydmwyanIzMzY2ZzZpYXEifQ.Q5ZSoK62bL1NYKt-HEyDiw';

// 🟢 Funktion för att filtrera markörer baserat på milisgrupp
function filterMarkers(faction) {
    console.log("Filtrerar på:", faction);

    if (!map.getLayer('unclustered-point')) {
        console.log("Lagret 'unclustered-point' existerar inte!");
        return;
    }

    if (faction === 'ALL') {
        console.log("Visa ALLA punkter och återställ tidslinjen.");
        map.setFilter('unclustered-point', ["all"]);
        document.getElementById('timeline').value = ""; // Återställ tidslinjen
        document.getElementById('selectedYear').textContent = "All"; // Visa att allt är valt
    } else {
        console.log("Filter på:", faction);
        map.setFilter('unclustered-point', ['==', ['get', 'warring_faction'], faction]);
    }
}

// Funktion för att stänga overlayen
function closeOverlay() {
    const overlay = document.getElementById('overlay');
    const dontShowAgain = document.getElementById('dontShowAgain');

    if (dontShowAgain.checked) {
        localStorage.setItem('hideOverlay', 'true');
    }

    overlay.classList.add('hidden');
}

// Kontrollera om overlayen ska döljas
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('hideOverlay') === 'true') {
        document.getElementById('overlay').classList.add('hidden');
    }
});

const buttons = document.querySelectorAll("#filters button");
buttons.forEach(button => {
    button.addEventListener("click", () => {
        buttons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        filterMarkers(button.textContent.trim());
    });
});

function flyToLiberia() {
    map.flyTo({
        center: [-9.4295, 6.4281],  // Longitud, Latitud för Liberia
        zoom: 7,
        speed: 1.2,
        curve: 1
    });
}

// Skapa kartan och centrera den över Liberia
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10', 
    center: [-9.4295, 6.4281],
    zoom: 6
});

// Ladda in GeoJSON och aktivera clustering
map.on('load', function () {
    // 🟢 Lägg in massakerdata
    map.addSource('events', {
        type: 'geojson',
        data: 'markers.geojson',
        cluster: true,
        clusterMaxZoom: 5,
        clusterRadius: 5
    });

    // 🟢 LÄGG TILL HISTORISKA PLATSER
    map.addSource('historiska-platser', {
        type: 'geojson',
        data: 'data/platser.geojson',
        cluster: false
    });

    map.addLayer({
        id: 'historiska-platser',
        type: 'circle',
        source: 'historiska-platser',
        paint: {
            'circle-color': '#0066cc',
            'circle-radius': 5
        }
    });

    // 🟢 POPUP FÖR HISTORISKA PLATSER
    map.on('click', 'historiska-platser', function (e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = `<h3>${e.features[0].properties.namn}</h3><p>${e.features[0].properties.beskrivning}</p>`;
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    

    // 🟢 Lägg till klustrade punkter
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'events',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': '#cc5500',
            'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 30],
            'circle-opacity': 0.8
        }
    });

    // 🟢 Lägg till individuella markörer
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'events',
        filter: ['!', ['has', 'point_count']],
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

    // 🟢 Klickhändelse för individuella markörer
    map.on('click', 'unclustered-point', function (e) {
        console.log("Warring faction:", e.features[0].properties.warring_faction);
    
        let coordinates = e.features[0].geometry.coordinates.slice();
        let description = `<b>${e.features[0].properties.name}</b><br>
        <b>County:</b> ${e.features[0].properties.county || 'Unknown'}<br>
                           <b>District:</b> ${e.features[0].properties.district}<br>
                           <b>Warring faction:</b> ${e.features[0].properties.warring_faction}<br>
                           <b>Date:</b> ${e.features[0].properties.date || 'Unknown'}<br>
                           <b>Casualties:</b> ${e.features[0].properties.casualties || 'Unknown'}`;
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    map.on('click', 'unclustered-point', function (e) {
        console.log("Klickad markör:", e.features[0].properties); // Debugging
    
        const props = e.features[0].properties;
        const sidebar = document.getElementById('sidebar');
        const content = document.getElementById('sidebar-content');
    
        if (!props) {
            console.log("Ingen data hittades för markören!");
            return;
        }
    
        const html = `
            <h3>${props.name || 'Unknown'}</h3>
            <p><strong>County:</strong> ${props.county || 'Unknown'}</p>
            <p><strong>District:</strong> ${props.district || 'Unknown'}</p>
            <p><strong>County:</strong> ${props.county || 'Unknown'}</p>
            <p><strong>Warring Faction:</strong> ${props.warring_faction || 'Unknown'}</p>
            <p><strong>Date:</strong> ${props.date || 'Unknown'}</p>
            <p><strong>Casualties:</strong> ${props.casualties || 'Unknown'}</p>
            <p><strong>Description:</strong> ${props.description || 'No description available.'}</p>
        `;
    
        content.innerHTML = html;
        sidebar.classList.add('open');
    });

    // 🟢 Lägg till Liberia-label
    map.addSource('liberia-label', {
        type: 'geojson',
        data: 'liberia-county-boundary.geojson'
    });

    map.addLayer({
        id: 'liberia-label',
        type: 'symbol',
        source: 'liberia-label',
        layout: {
            'text-field': ['get', 'name'],
            'text-size': 24,
            'text-font': ['Open Sans Bold'],
            'text-offset': [0, 1.5],
            'text-anchor': 'top'
        },
        paint: {
            'text-color': '#000000',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 2
        }
    });

    // 🟢 Ladda in Liberia counties från GeoJSON
map.addSource('liberia-boundary', {
    type: 'geojson',
    data: 'liberia-county-boundary.geojson'
});

// 🟢 Lägg till ett lager som markerar Liberia och ger det en tydlig färg
map.addLayer({
    id: 'liberia-highlight',
    type: 'fill',
    source: 'liberia-boundary',
    layout: {},
    paint: {
        'fill-color': '#A0A0A0',  // Ljusare grå för Liberia
        'fill-opacity': 0.2,  // Ökar genomskinligheten
        'fill-outline-color': '#B0B0B0' // Ljusare kantlinje
    }
    
});

    // 🟢 Flytta Liberia-label över andra lager
    map.moveLayer('liberia-label', 'clusters');
});

// 🟢 Tidslinjeuppdatering
document.getElementById('timeline').addEventListener('input', function(e) {
    let selectedYear = e.target.value;
    document.getElementById('selectedYear').textContent = selectedYear;
    map.setFilter('unclustered-point', ['==', ['get', 'date'], selectedYear]);
});

// 🟢 Se till att fraktionsknapparna uppdaterar filtret
const factionButtons = document.querySelectorAll("#filters button");
factionButtons.forEach(button => {
    button.addEventListener("click", () => {
        factionButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        filterMarkers(button.textContent.trim());
    });
});

const allButton = document.getElementById("show-all");

if (allButton) {
    allButton.addEventListener("click", () => {
        console.log("Visa alla klickad!");
        map.setFilter('unclustered-point', ['!', ['has', 'point_count']]); // Återställ alla punkter
    });
} else {
    console.log("Knappen 'show-all' hittades inte!");
}

document.getElementById('sidebar').classList.add('open');

console.log(document.getElementById('sidebar'));

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
}

// 🟢 Hämta referenser till filtreringsfält
const factionSelect = document.getElementById("faction-select");
const cityInput = document.getElementById("city-input");
const countySelect = document.getElementById("county-select");
const timeline = document.getElementById("timeline");
const casualtiesMin = document.getElementById("casualties-input");
const casualtiesMax = document.getElementById("casualties-max-input");

// 🟢 Lyssna på förändringar i filtren
factionSelect.addEventListener("change", applyFilters);
cityInput.addEventListener("input", applyFilters);
countySelect.addEventListener("change", applyFilters);
timeline.addEventListener("input", applyFilters);
casualtiesMin.addEventListener("input", applyFilters);
casualtiesMax.addEventListener("input", applyFilters);

function applyFilters() {
    let filters = ["all"]; // Starta med att inkludera allt

    let selectedFaction = factionSelect.value;
    let selectedCity = cityInput.value.toLowerCase();
    let selectedCounty = countySelect.value;
    let selectedYear = timeline.value;
    let minCasualties = casualtiesMin.value ? parseInt(casualtiesMin.value) : null;
    let maxCasualties = casualtiesMax.value ? parseInt(casualtiesMax.value) : null;

    // 🟢 Filtrera på Warring Faction
    if (selectedFaction !== "ALL") {
        filters.push(["==", ["get", "warring_faction"], selectedFaction]);
    }

    // 🟢 Filtrera på Stad (Name-fält)
    if (selectedCity) {
        filters.push(["match", ["downcase", ["get", "name"]], selectedCity, true, false]);
    }

    // 🟢 Filtrera på County
    if (selectedCounty !== "ALL") {
        filters.push(["==", ["get", "county"], selectedCounty]);
    }

    // 🟢 Filtrera på Årtal
    if (selectedYear) {
        filters.push(["==", ["get", "date"], selectedYear]);
    }

    // 🟢 Filtrera på Antal Döda
    if (minCasualties !== null || maxCasualties !== null) {
        let casualtiesFilter = ["all"];
        if (minCasualties !== null) {
            casualtiesFilter.push([">=", ["get", "casualties"], minCasualties]);
        }
        if (maxCasualties !== null) {
            casualtiesFilter.push(["<=", ["get", "casualties"], maxCasualties]);
        }
        filters.push(casualtiesFilter);
    }

    // 🟢 Sätt filter på kartlagret
    map.setFilter("unclustered-point", filters);
}

// 🟢 Återställ filter
function resetFilters() {
    factionSelect.value = "ALL";
    cityInput.value = "";
    countySelect.value = "ALL";
    timeline.value = "1990";
    casualtiesMin.value = "";
    casualtiesMax.value = "";
    applyFilters();
}

function loadCounties() {
    fetch("markers.geojson")
        .then(response => response.json())
        .then(data => {
            let counties = new Set();

            data.features.forEach(feature => {
                if (feature.properties.county) {
                    counties.add(feature.properties.county);
                }
            });

            counties = Array.from(counties).sort();
            counties.forEach(county => {
                let option = document.createElement("option");
                option.value = county;
                option.textContent = county;
                countySelect.appendChild(option);
            });
        })
        .catch(error => console.error("Fel vid laddning av counties:", error));
}

document.addEventListener('DOMContentLoaded', function () {
    // 🟢 Hantera filtreringsmenyns hopfällning
    const filterContainer = document.getElementById('filter-container');
    const filterToggle = document.getElementById('toggle-filters');
    const filters = document.getElementById('filters');

    filterToggle.addEventListener('click', function () {
        filters.classList.toggle('hidden');
        filterToggle.textContent = filters.classList.contains('hidden') ? "Filter ⏵" : "Filter ⏷";
    });

    // 🟢 Funktion för att filtrera markörer
    function filterMarkers(faction) {
        console.log("Filtrerar på:", faction);
        if (faction === 'ALL') {
            console.log("Visar alla punkter");
            map.setFilter('unclustered-point', null); 
        } else {
            map.setFilter('unclustered-point', ['==', ['get', 'warring_faction'], faction]);
        }
    }

    // 🟢 Stäng sidopanel
    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
    }

    // 🟢 Lägg till event listeners för filterknappar
    document.querySelectorAll("#filters button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll("#filters button").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            filterMarkers(button.textContent.trim());
        });
    });
});


// Kör när sidan laddas
document.addEventListener("DOMContentLoaded", loadCounties);
