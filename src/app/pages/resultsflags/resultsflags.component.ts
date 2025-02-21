import { CommonModule } from '@angular/common';
import { Component, OnInit ,ElementRef, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LeaderboardService } from '../../services/leaderboard.service';
import * as maplibregl from 'maplibre-gl';

export interface LeaderboardEntry {
  name: string;
  score: number;
  time: string;
  mode: string;
}

@Component({
  selector: 'app-resultsflags',
  imports: [CommonModule ],
  templateUrl: './resultsflags.component.html',
  styleUrls: ['./resultsflags.component.css']
})
export class ResultsflagsComponent implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: maplibregl.Map;
  // Data received via query parameters
  flagName: string = '';
  flagImage: string = '';
  guessedCountry: string = '';
  timeLeft: number = 0;
  roundScore: number = 0;
  totalScore: number = 0;
  round: number = 1;
  isFinal: boolean = false;
  timePassed: number = 0;
  istrue: boolean = false;
  hover: boolean = true;

  // Additional country details to be fetched
  capital: string = 'N/A';
  population: number = 0;
  latitudeCorrect: number = 0;
  longitudeCorrect: number = 0;
  latitudeGuessed: number = 0;
  longitudeGuessed: number = 0;

  // Loading / error states for the fetch
  loading: boolean = true;
  error: string = '';

  constructor(private route: ActivatedRoute, private router: Router , private leaderboardService: LeaderboardService ) {}

  ngOnInit(): void {
    // Retrieve data from query parameters
    this.route.queryParams.subscribe(params => {
      this.flagName = params['flagName'] || '';
      this.flagImage = params['flagImage'] || '';
      this.guessedCountry = params['guessedCountry'] || '';
      this.timeLeft = +params['timeLeft'] || 0;
      this.roundScore = +params['roundScore'];
      this.totalScore = +params['totalScore'];
      this.round = +params['currentRound'] || 1;
      this.timePassed = +params['timePassed'] || 0;

      // Fetch additional details for the correct country
      if (this.flagName) {
        this.fetchCountryDetails(this.flagName);
        this.fetchGuessedCountryDetails();
      } else {
        this.loading = false;
        this.error = 'No country name provided';
      }
    });
    this.totalScore += this.roundScore;
    if (this.guessedCountry == this.flagName) {
      this.istrue = true;
    }
    if (this.round == 10) {
      this.isFinal = true;
    }
    this.fetchCountryCorrect();
    this.fetchCountryDetails(this.flagName);
    this.hover = false;
  }

  fetchCountryDetails(countryName: string): void {
    // Use the REST Countries API to fetch details about the country
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching details for ${countryName}`);
        }
        return response.json();
      })
      .then(data => {
        const countryData = data[0]; // Assume the first entry is the correct one
        this.capital = countryData.capital && countryData.capital.length > 0 ? countryData.capital[0] : 'N/A';
        this.population = countryData.population || 0;
        this.latitudeCorrect = countryData.latlng ? countryData.latlng[0] : 0;
        this.longitudeCorrect = countryData.latlng ? countryData.latlng[1] : 0;
        this.loading = false;
      })
      .catch(err => {
        console.error('Error fetching country details:', err);
        this.error = 'Failed to fetch country details';
        this.loading = false;
      });
  }
  // Fetch additional details for the guessed country
  fetchGuessedCountryDetails(): void {
    if (this.guessedCountry) {
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(this.guessedCountry)}?fullText=true`;
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error fetching details for ${this.guessedCountry}`);
          }
          return response.json();
        })
        .then(data => {
          const countryData = data[0]; // Assume the first entry is the correct one
          this.latitudeGuessed = countryData.latlng ? countryData.latlng[0] : 0;
          this.longitudeGuessed = countryData.latlng ? countryData.latlng[1] : 0;
        })
        .catch(err => {
          console.error('Error fetching guessed country details:', err);
        });
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  // Navigate to the next round (or back to the game)
  goToNextRound(): void {
    // Increment the round counter
    this.round++;
    // For example, navigate back to the flags mode component.
    this.router.navigate(['/flags'], { 
      queryParams: { totalScore : this.totalScore, round: this.round , timePassed: this.timePassed}
    });
  }

    // Leaderboard
    saveScore() {
      const playerName = prompt("Enter your name:");
      if (!playerName) return;
  
  
      const newEntry: LeaderboardEntry = {
        name: playerName,
        score: this.totalScore,
        time: `${Math.floor( this.timePassed / 60)}m ${this.timePassed % 60}s`,
        mode: 'Flags Mode'

      };
  
      this.leaderboardService.addEntry(newEntry);
      this.timePassed = 0;
    }

    // Navigate to the leaderboard
    goToLeaderboard() {
      this.router.navigate(['/leaderboard']);
    }

    // Restart the game
    restartGame() {
      this.router.navigate(['/flags']);
    }

    // Map
    // Variable to store the currently hovered country (for hover effects)
  private hoveredFeatureId: string | number | undefined;
  // Variable to store the currently clicked country (for click effects)
  private clickedFeatureId: string | number | undefined;
  
  selectedCountry: string = '';
  countryname: string = '';
  countryCoords: [number, number][] = [];



  ngAfterViewInit(): void {
    this.initializeMap();
    if (this.flagName && this.guessedCountry) {
      this.countryCoords = [ [this.longitudeCorrect, this.latitudeCorrect] , [this.longitudeGuessed, this.latitudeGuessed] ];
      this.fitMapToBounds(this.map, this.countryCoords);
      console.log('1:');
    }
    else if(this.flagName){
      this.fitMapToBounds(this.map, [ [this.longitudeCorrect, this.latitudeCorrect] , [this.longitudeCorrect, this.latitudeCorrect] ] );
      // Add these before calling fitMapToBounds
      console.log('2:' + this.countryCoords);
    }

  }

  async initializeMap() {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=ux7U0JoDzUbunhk0mxHh',
      center: [2, 45], // Initial view (longitude, latitude)
      zoom: 3,
      attributionControl: false,
    });
    this.map.addControl(new maplibregl.NavigationControl());
    this.map.on('load', () => {
      this.loadGeoJson();
      if (this.flagName && this.guessedCountry) {
        this.countryCoords = [
          [this.longitudeCorrect, this.latitudeCorrect], 
          [this.longitudeGuessed, this.latitudeGuessed]
        ];
        this.fitMapToBounds(this.map, this.countryCoords);
      } else if (this.flagName) {
        this.fitMapToBounds(this.map, [[this.longitudeCorrect, this.latitudeCorrect]]);
      }
    });

  }

  // Load GeoJSON with country boundaries (borders.json)
  private loadGeoJson(): void {
    const geoJsonUrl = 'data/borders.json'; // Path to your borders GeoJSON file
    fetch(geoJsonUrl)
      .then(response => response.json())
      .then(geoJsonData => {
        // Assign a unique ID to each feature
        geoJsonData.features.forEach((feature: { id: any; }, index: number) => {
          feature.id = index;
        });

        // Add GeoJSON source to the map
        this.map.addSource('countries', {
          type: 'geojson',
          data: geoJsonData
        });

        // Add GeoJSON layer to display countries
        let fillColorExpression;

        if (!this.hover) {
          // When hover effects are disabled, do not include any hover condition.
          fillColorExpression = [
            'case',
            // Always fill the correct country with green:
            ['==', ['get', 'NAME'], this.flagName], '#00ff00',
            // Always fill the false country with red:
            ['==', ['get', 'NAME'], this.guessedCountry], '#ff0000',
            // Otherwise, keep transparent:
            'rgba(0,0,0,0)'
          ];
        } else {
          // When hover effects are enabled, include hover in the expression.
          fillColorExpression = [
            'case',
            // Persistent highlight for correct and false countries:
            ['==', ['get', 'NAME'], this.flagName], '#00ff00',
            ['==', ['get', 'NAME'], this.guessedCountry], '#ff0000',
            // If no persistent highlight, apply hover color if hovered:
            ['boolean', ['feature-state', 'hover'], false], '#ffff00',
            ['boolean', ['feature-state', 'click'], false], '#ffff00',
            // Default transparent fill:
            'rgba(0,0,0,0)'
          ];
        }
        
        // Now add your layer with the computed expression:
        this.map.addLayer({
          id: 'countries-layer',
          type: 'fill',
          source: 'countries',
          layout: {},
          paint: {
            'fill-color': fillColorExpression as maplibregl.ExpressionSpecification,
            
            // You can set fill-opacity similarly, e.g.:
            'fill-opacity': 0.5
          }
        });
        

        // Handle mouse events for country interaction
        this.map.on('mousemove', 'countries-layer', (e) => this.highlightFeature(e));
        this.map.on('mouseleave', 'countries-layer', (e) => this.resetHighlight(e));
        this.map.on('click', 'countries-layer', (e) => this.clickFeature(e));
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
        alert('Error loading the map data.');
      });
  }
  
  // Highlight feature on mousemove (hover)
  private highlightFeature(e: maplibregl.MapMouseEvent): void {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['countries-layer'] });
    if (features.length > 0) {
      const newHoveredId = features[0].id;
      // Remove hover state from previously hovered feature if it is different
      if (this.hoveredFeatureId !== undefined && this.hoveredFeatureId !== newHoveredId) {
        this.map.setFeatureState(
          { source: 'countries', id: this.hoveredFeatureId },
          { hover: false }
        );
      }
      this.hoveredFeatureId = newHoveredId;
      this.map.setFeatureState(
        { source: 'countries', id: this.hoveredFeatureId },
        { hover: true }
      );
      this.countryname = features[0].properties['NAME'];
    }
  }
  
  // Remove hover state when mouse leaves the country area
  private resetHighlight(e: maplibregl.MapMouseEvent): void {
    if (this.hoveredFeatureId !== undefined) {
      this.map.setFeatureState(
        { source: 'countries', id: this.hoveredFeatureId },
        { hover: false }
      );
      this.hoveredFeatureId = undefined;
    }
  }

  // Set a country as clicked and emit its name.
  // Also, reset the previously clicked country (if any) to normal.
  private clickFeature(e: maplibregl.MapMouseEvent): void {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['countries-layer'] });
    if (features.length > 0) {
      const newClickedId = features[0].id;
      // Reset the previously clicked country's state if it's different from the new one
      if (this.clickedFeatureId !== undefined && this.clickedFeatureId !== newClickedId) {
        this.map.setFeatureState(
          { source: 'countries', id: this.clickedFeatureId },
          { click: false }
        );
      }
      this.clickedFeatureId = newClickedId;
      this.map.setFeatureState(
        { source: 'countries', id: this.clickedFeatureId },
        { click: true }
      );
      this.selectedCountry = features[0].properties['NAME'];
    }
  }


  
  async fetchCountryCorrect(): Promise<void> {
    if (this.flagName) {
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(this.flagName)}?fullText=true`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error fetching details for ${this.flagName}`);
        }
        const data = await response.json();
        const countryData = data[0];
        if (countryData.latlng && countryData.latlng.length >= 2) {
          // API returns [lat, lng] so assign accordingly.
          this.latitudeCorrect = countryData.latlng[0];
          this.longitudeCorrect = countryData.latlng[1];
          console.log(`Correct country (${this.flagName}) coordinates: [${this.longitudeCorrect}, ${this.latitudeCorrect}]`);
        } else {
          console.error('LatLng data missing for correct country.');
        }
        // Update bounds if both coordinates are available.
        this.updateMapBounds();
      } catch (err) {
        console.error('Error fetching correct country details:', err);
      }
    }
  }
  

  
  // Extend bounds to include both locations
  fitMapToBounds(map: maplibregl.Map, coords: [number, number][]): void {
    // Création d'un objet bounds et extension avec chaque coordonnée
    const bounds = new maplibregl.LngLatBounds();
    coords.forEach(coord => {
      bounds.extend(new maplibregl.LngLat(coord[0], coord[1]));
    });
  
    // Ajustement de la carte aux bounds avec animation fluide
    map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      duration: 3000,    // Durée de l'animation en millisecondes
      maxZoom: 3,        // Limite le niveau de zoom pour éviter un zoom excessif
      minZoom: 1        // Limite le niveau de zoom pour éviter un zoom excessif
      // Vous pouvez ajouter une fonction d'easing personnalisée ici si nécessaire
    });
  }
  
  updateMapBounds(): void {
    // verify that all coordinates are available
    if (
      this.longitudeGuessed !== 0 && this.latitudeGuessed !== 0 &&
      this.longitudeCorrect !== 0 && this.latitudeCorrect !== 0
    ) {
      this.countryCoords = [
        [this.longitudeGuessed, this.latitudeGuessed],
        [this.longitudeCorrect, this.latitudeCorrect]
      ];
      // check if map is loaded before fitting bounds
      if (this.map && this.map.loaded()) {
        this.fitMapToBounds(this.map, this.countryCoords);
      } else {
        console.error('L’instance de la carte n’est pas encore prête.');
      }
    } else {
      console.warn("Coordonnées invalides pour fitBounds.");
    }
  }
  

}


