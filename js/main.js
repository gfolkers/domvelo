let currentMarker = null;

const siteCoords = {
  Langlade: [43.5663944676189, 1.428336833831221],
  Mesple: [43.571519, 1.389373],
  Colomiers: [43.59498133685495, 1.361973179834589],
  Atlanta: [43.640459477739, 1.4713761926719788],
  Garossos: [43.665028300214985, 1.3618322315093234]
};

const geojsonData = {
  Langlade: {
    vel: {
      15: Langlade_vel_15,
      30: Langlade_vel_30
    }, 
    vel_elec: {
      15: Langlade_vel_elec_15,
      30: Langlade_vel_elec_30
    }
  },
  Mesple: {
    vel: {
      15: Mesple_vel_15,
      30: Mesple_vel_30
    },
    vel_elec: {
      15: Mesple_vel_elec_15,
      30: Mesple_vel_elec_30
    }
  },
  Colomiers: {
    vel: {
      15: Colomiers_vel_15,
      30: Colomiers_vel_30
    },
    vel_elec: {
      15: Colomiers_vel_elec_15,
      30: Colomiers_vel_elec_30
    }
  },
  Atlanta: {
    vel: {
      15: Atlanta_vel_15,
      30: Atlanta_vel_30
    },
    vel_elec: {
      15: Atlanta_vel_elec_15,
      30: Atlanta_vel_elec_30
    }
  },
  Garossos: {
    vel: {
      15: Garossos_vel_15,
      30: Garossos_vel_30
    },
    vel_elec: {
      15: Garossos_vel_elec_15,
      30: Garossos_vel_elec_30
    }
  }
};

const map = L.map('map').setView([43.6, 1.45], 12);

L.tileLayer('https://{s}.tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=cWZonTyQBtrCu3JI8qafzk00Q8zsdkuVzhDV77fiGAkaf5vLxTLU2RPfY4e8y0zd', {
  attribution: '&copy; <a href="https://jawg.io">Jawg</a> contributors | Réalisation : Grégoire Folkers-Gay - Tisséo Voyageurs',
}).addTo(map);

// Ajout de la légende pour isochrones
const legendExisting = document.getElementById('isochrones-legend');

const legendControl = L.control({ position: 'bottomright' });
legendControl.onAdd = function () {
  const container = L.DomUtil.create('div', 'leaflet-control-legend');
  
  // Empêche la carte de bouger lors du scroll/hover sur la légende
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);

  if (legendExisting) {
    // Envelopper dans le fond intérieur
    const innerDiv = L.DomUtil.create('div', 'legend-inner', container);
    innerDiv.appendChild(legendExisting);
  } else {
    container.innerHTML = `
      <div class="legend-inner">
        <div id="isochrones-legend">
          <div class="legend-title">
            <span style="font-size: 20px;">🚴</span>
            <span>Temps de parcours à vélo</span>
          </div>
          
          <div class="legend-item">
            <span class="legend-swatch legend-30"></span>
            <span class="legend-text">Moins de 30 minutes</span>
          </div>
          
          <div class="legend-item">
            <span class="legend-swatch legend-15"></span>
            <span class="legend-text">Moins de 15 minutes</span>
          </div>
          
          <div class="legend-note">
            Distance approximative calculée sur une vitesse moyenne 
            de 15 km/h en vélo mécanique et 20 km/h en vélo électrique.
          </div>
        </div>
      </div>`;
  }
  return container;
};
legendControl.addTo(map);



// Fonction pour créer l'icône personnalisée avec lettre
// Ajout optionnel d'un paramètre bikeType (par défaut récupère la radio sélectionnée)
function createSiteIcon(letter, bikeType = (document.querySelector('input[name="bike"]:checked') ? document.querySelector('input[name="bike"]:checked').value : 'vel')) {
  // style commun au badge (même fond / même padding pour velélec et vélomécanique)
  const bikeBadgeBaseStyle = `
    position: absolute;
    top: 50px;
    left: 55%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: white;
    padding: 4px 10px;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    border: 1px solid rgba(0,0,0,0.08);
    pointer-events: auto;
  `;

  // wrapper intérieur commun pour l'emoji vélo (permet d'ajouter l'éclair sans modifier le badge)
  const bikeInnerBase = `
    <span style="position: relative; display: inline-block; line-height:1; vertical-align: middle;">
      <span style="font-size:20px; line-height:1; display:inline-block;">🚲</span>
    </span>
  `;

  let bikeBadgeHtml;
  if (bikeType === 'vel_elec') {
    bikeBadgeHtml = `
      <span class="site-bike-badge" title="Vélo électrique" style="${bikeBadgeBaseStyle}">
        <span style="position: relative; display: inline-block; line-height:1; vertical-align: middle;">
          <span style="font-size:20px; line-height:1; display:inline-block;">🚲</span>
          <span style="position:absolute; top:-3px; right:-6px; font-size:10px; line-height:1; display:inline-block;">⚡</span>
        </span>
      </span>
    `;
  } else {
    // même structure / même padding, pas d'éclair
    bikeBadgeHtml = `
      <span class="site-bike-badge" title="Vélo mécanique" style="${bikeBadgeBaseStyle}">
        ${bikeInnerBase}
      </span>
    `;
  }

  return L.divIcon({
    className: 'custom-site-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: inline-block;">
        <div class="site-marker-content" style="
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white;
          font-weight: bold;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 10px rgba(0, 123, 255, 0.4);
          border: 3px solid white;
          font-family: 'Arial', sans-serif;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        ">${letter}</div>
        ${bikeBadgeHtml}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}


const homeIcon = L.icon({
  iconUrl: './img/house.svg',
  iconSize: [40, 40],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30]
});

let homeMarker = null;
let homeCoordinates = null;

// Les étapes sont maintenant inversées : step-1 = site, step-2 = adresse
const step1 = document.getElementById('step-1'); // Sélection du site
const step2 = document.getElementById('step-2'); // Recherche d'adresse
const step3 = document.getElementById('step-3'); // Itinéraire
const geocoderContainer = document.getElementById('geocoder-container');

// Configuration OpenRouteService
const ORS_API_KEY = '5b3ce3597851110001cf62480d7a09a33ca74a83bfbda743ee0bb38e';

// Périmètre circulaire: centre = Toulouse, rayon = 35 km (ajuste si besoin)
const CIRCLE = {
  lat: 43.6045,   // Centre Toulouse
  lon: 1.4440,
  radius: 40   // en mètres (ex: 35000 = 35 km)
};

// Initialiser l'état : step-1 active, step-2 activée (changement ici), step-3 désactivée
step2.classList.remove('disabled'); // Activation de l'étape 2 dès le départ
step3.classList.add('disabled');

// Fonction pour mettre à jour l'état de l'étape 3
function updateStep3Status() {
  if (homeCoordinates) {
    // Adresse renseignée : activer l'étape 3
    step3.classList.remove('disabled');
  } else {
    // Pas d'adresse : désactiver l'étape 3
    step3.classList.add('disabled');
  }
}

// Nouvelle fonction pour mettre à jour la note dynamiquement
function updateRouteNote() {
  const noteDiv = document.getElementById('route-info-note');
  const selectedSite = document.querySelector('input[name="site"]:checked');

  if (noteDiv) {
    const siteName = selectedSite ? selectedSite.value : 'le site sélectionné';

    noteDiv.innerHTML = `
      📍 L'itinéraire sera calculé depuis votre <strong>domicile</strong> vers le site de <strong>${siteName}</strong>
    `;
  }
}

// Créer l'interface de géocodage personnalisée
function createGeocoder() {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'geocoder-search-container';
  searchContainer.style.cssText = `
    position: relative;
    width: 300px;
    font-family: Arial, sans-serif;
  `;

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Rechercher votre adresse...';
  searchInput.className = 'geocoder-search-input';
  searchInput.style.cssText = `
    width: 100%;
    padding: 10px 34px 10px 10px; /* espace à droite pour le spinner */
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;
  `;

  // Spinner
  const spinner = document.createElement('div');
  spinner.className = 'geocoder-spinner';
  spinner.setAttribute('aria-hidden', 'true');
  spinner.style.cssText = `
    position: absolute;
    top: 50%;
    right: 10px;
    width: 16px;
    height: 16px;
    margin-top: -8px;
    border: 2px solid #ccc;
    border-top-color: #4A90E2; /* couleur de l’animation */
    border-radius: 50%;
    animation: geocoder-spin 0.8s linear infinite;
    display: none; /* caché par défaut */
    pointer-events: none;
  `;

  const suggestionsList = document.createElement('ul');
  suggestionsList.className = 'geocoder-suggestions';
  suggestionsList.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 6px 6px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    list-style: none;
    margin: 0;
    padding: 0;
    display: none;
  `;

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(spinner);        // <— AJOUT
  searchContainer.appendChild(suggestionsList);

    let debounceTimer;
  let selectedIndex = -1;
  let currentRequestId = 0; // identifiant de requête en cours

  function showSpinner() {
    spinner.style.display = 'block';
    searchInput.setAttribute('aria-busy', 'true');
  }

  function hideSpinner() {
    spinner.style.display = 'none';
    searchInput.removeAttribute('aria-busy');
  }

  // Fonction de recherche avec OpenRouteService (restreinte à un cercle autour de Toulouse)
  async function searchAddresses(query) {
    if (query.length < 6) {
      suggestionsList.style.display = 'none';
      hideSpinner();
      return;
    }

    const requestId = ++currentRequestId;
    showSpinner();

    try {
      const url = new URL('https://api.openrouteservice.org/geocode/search');
      url.searchParams.set('api_key', ORS_API_KEY);
      url.searchParams.set('text', query);
      url.searchParams.set('size', '5');

      // Garde la France
      url.searchParams.set('boundary.country', 'FR');

      // Restriction par cercle
      url.searchParams.set('boundary.circle.lat', String(CIRCLE.lat));
      url.searchParams.set('boundary.circle.lon', String(CIRCLE.lon));
      url.searchParams.set('boundary.circle.radius', String(CIRCLE.radius));

      // Améliore la pertinence des résultats autour du centre
      url.searchParams.set('focus.point.lat', String(CIRCLE.lat));
      url.searchParams.set('focus.point.lon', String(CIRCLE.lon));

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // Si une autre requête plus récente a démarré, on ignore cette réponse
      if (requestId !== currentRequestId) return;

      displaySuggestions(data.features);
    } catch (error) {
      // Si une autre requête plus récente a démarré, on ignore l’erreur visuelle
      if (requestId === currentRequestId) {
        console.error('Erreur lors de la recherche:', error);
        suggestionsList.style.display = 'none';
      }
    } finally {
      // Ne cacher le spinner que si c’est toujours la requête active
      if (requestId === currentRequestId) hideSpinner();
    }
  }


  // Afficher les suggestions
  function displaySuggestions(features) {
    suggestionsList.innerHTML = '';
    selectedIndex = -1;

    if (features.length === 0) {
      suggestionsList.style.display = 'none';
      return;
    }

    features.forEach((feature, index) => {
      const li = document.createElement('li');
      li.textContent = feature.properties.label;
      li.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
      `;

      li.addEventListener('mouseenter', () => {
        li.style.backgroundColor = '#f0f0f0';
        selectedIndex = index;
      });

      li.addEventListener('mouseleave', () => {
        li.style.backgroundColor = 'white';
      });

      li.addEventListener('click', () => {
        selectAddress(feature);
      });

      suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = 'block';
  }

  function selectAddress(feature) {
  const coords = feature.geometry.coordinates;
  const lat = coords[1];
  const lng = coords[0];
  const label = feature.properties.label;

  // Stocker les coordonnées du domicile
  homeCoordinates = [lat, lng];

  // Récupérer la site sélectionné (valeur de la radio)
  const siteRadio = document.querySelector('input[name="site"]:checked');
  if (!siteRadio) {
    alert("Veuillez sélectionner d'abord un site.");
    return;
  }
  const selectedSite = siteRadio.value;
  const siteCoord = siteCoords[selectedSite];

  // Mettre la valeur dans l'input
  searchInput.value = label;
  suggestionsList.style.display = 'none';

  // Retirer l'ancien marqueur
  if (homeMarker) {
    map.removeLayer(homeMarker);
  }

  // Ajouter le nouveau marqueur
  homeMarker = L.marker([lat, lng], { icon: homeIcon })
    .addTo(map)
    .bindPopup(`<strong>Adresse trouvée</strong><br>${label}`)
    .openPopup();

  // Créer un bounds qui englobe les deux coordonnées (ordre correct : [lat,lng])
  const bounds = L.latLngBounds(
    [homeCoordinates[0], homeCoordinates[1]], // domicile [lat,lng]
    [siteCoord[0], siteCoord[1]]              // site [lat,lng]
  );

  // Ajuster la vue pour englober les deux points
  map.fitBounds(bounds, {
    padding: [50, 50],
    maxZoom: 15,
    minZoom: 12 // Ajoute un padding de 50px autour pour plus de confort visuel
  });

  // Mettre à jour l'état de l'étape 3
  updateStep3Status();

  // Mettre à jour la note explicative
  updateRouteNote();
}

  // Event listeners
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchAddresses(e.target.value);
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsList.querySelectorAll('li');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
    } else if (e.key === 'Escape') {
      suggestionsList.style.display = 'none';
      selectedIndex = -1;
    }
  });

  function updateSelection(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.style.backgroundColor = '#f0f0f0';
      } else {
        item.style.backgroundColor = 'white';
      }
    });
  }

  // Cacher les suggestions quand on clique ailleurs
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      suggestionsList.style.display = 'none';
    }
  });

  return searchContainer;
}

// Créer et ajouter le géocodeur
const geocoderElement = createGeocoder();
geocoderContainer.appendChild(geocoderElement);

let currentLayers = [];

function clearLayers() {
  currentLayers.forEach(layer => map.removeLayer(layer));
  currentLayers = [];
}

function loadGeoJSON(site, type) {
  clearLayers();

  const coords = siteCoords[site];
  map.setView(coords, 13);

  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  // Créer l'icône avec la première lettre du site
  const firstLetter = site.charAt(0).toUpperCase();
  // Passe le type de vélo au createSiteIcon pour afficher le badge correct
  const siteIcon = createSiteIcon(firstLetter, type);

  currentMarker = L.marker(coords, { icon: siteIcon })
    .addTo(map)
    .bindPopup(`<strong>${site}</strong>`);

  [30, 15].forEach(duration => {
    const geojson = geojsonData[site][type][duration];
    if (geojson) {
      const color = duration === 15 ? 'green' : 'gold';
      const fillColor = duration === 15 ? 'green' : 'yellow';

      const layer = L.geoJSON(geojson, {
        style: {
          color: color,
          fillColor: fillColor,
          fillOpacity: 0.3,
          weight: 2
        }
      }).addTo(map);

      currentLayers.push(layer);
    }
  });
}

// Fonction pour ouvrir l'itinéraire dans Géovélo
function openGeoveloRoute() {
  const selectedSite = document.querySelector('input[name="site"]:checked').value;
  const selectedBike = document.querySelector('input[name="bike"]:checked').value;
  const siteCoord = siteCoords[selectedSite];

  let fromCoord, toCoord;

  if (homeCoordinates) {
    // De l'adresse vers le site
    fromCoord = `${homeCoordinates[1]},${homeCoordinates[0]}`;
    toCoord = `${siteCoord[1]},${siteCoord[0]}`;
  } else {
    // Du centre-ville (coordonnées par défaut) vers le site
    fromCoord = `1.444,43.604`; // Coordonnées du centre de Toulouse
    toCoord = `${siteCoord[1]},${siteCoord[0]}`;
  }

  // Calculer le centre de la carte entre les deux points
  const centerLat = homeCoordinates ? 
    (homeCoordinates[0] + siteCoord[0]) / 2 : 
    (43.604 + siteCoord[0]) / 2;
  const centerLng = homeCoordinates ? 
    (homeCoordinates[1] + siteCoord[1]) / 2 : 
    (1.444 + siteCoord[1]) / 2;

  // Déterminer le paramètre e-bike selon le type de vélo sélectionné
  const eBikeParam = selectedBike === 'vel_elec' ? 'true' : 'false';

  // Construire l'URL Géovélo avec le bon paramètre e-bike
  const geoVeloUrl = `https://geovelo.app/fr/route/?bike-type=own&c=${centerLng}%2C${centerLat}&e-bike=${eBikeParam}&from=${fromCoord}&to=${toCoord}&z=14.57`;

  // Ouvrir dans un nouvel onglet
  window.open(geoVeloUrl, '_blank');
}

// Ajouter un bouton Géovélo dans l'étape 3
function createGeoVeloButton() {
  const step3Container = document.getElementById('step-3');

  // Créer le bouton Géovélo
  const geoVeloButton = document.createElement('button');
  geoVeloButton.innerHTML = `
    <span style="margin-right: 8px;">🚴‍♂️</span>
    VOIR L'ITINÉRAIRE SUR GÉOVÉLO
  `;
  geoVeloButton.style.cssText = `
    width: 100%;
    padding: 15px 20px;
    background: linear-gradient(135deg, #00A86B 0%, #0ea5e9 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;

  geoVeloButton.addEventListener('mouseenter', () => {
    geoVeloButton.style.transform = 'translateY(-2px)';
    geoVeloButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
  });

  geoVeloButton.addEventListener('mouseleave', () => {
    geoVeloButton.style.transform = 'translateY(0)';
    geoVeloButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  });

  geoVeloButton.addEventListener('click', () => {
    // Animation de clic
    geoVeloButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
      geoVeloButton.style.transform = 'translateY(0)';
      openGeoveloRoute();
    }, 100);
  });

  // Ajouter le bouton à l'étape 3
  step3Container.appendChild(geoVeloButton);

  // Ajouter une note explicative avec ID unique
  const noteDiv = document.createElement('div');
  noteDiv.id = 'route-info-note'; // ID unique pour la retrouver facilement
  noteDiv.style.cssText = `
    margin-top: 10px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 6px;
    font-size: 12px;
    color: #6c757d;
    text-align: center;
  `;

  step3Container.appendChild(noteDiv);

  // Mettre à jour la note immédiatement
  updateRouteNote();
}

// Initialiser le bouton Géovélo
createGeoVeloButton();

// Event listeners pour les changements de sélection
document.querySelectorAll('input[name="site"], input[name="bike"]').forEach(input => {
  input.addEventListener('change', () => {
    const site = document.querySelector('input[name="site"]:checked').value;
    const type = document.querySelector('input[name="bike"]:checked').value;

    // Charger le GeoJSON pour le site sélectionné
    loadGeoJSON(site, type);

    // Activer l'étape 2 (recherche d'adresse) après sélection du site
    step2.classList.remove('disabled');

    // Vérifier l'état de l'étape 3
    updateStep3Status();

    // Mettre à jour la note explicative
    updateRouteNote();
  });
});

//Chargement initial des isochrones de Mesplé au démarrage de l'application
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier que la radio Mesplé est bien sélectionnée
  const mespleRadio = document.querySelector('input[name="site"][value="Mesple"]');
  const defaultBike = document.querySelector('input[name="bike"]:checked');
  
  if (mespleRadio && mespleRadio.checked && defaultBike) {
    // Charger automatiquement les isochrones de Mesplé
    loadGeoJSON('Mesple', defaultBike.value);
  }
});
