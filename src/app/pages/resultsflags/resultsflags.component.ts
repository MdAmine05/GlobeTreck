import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
  imports: [CommonModule],
  templateUrl: './resultsflags.component.html',
  styleUrls: ['./resultsflags.component.css']
})
export class ResultsflagsComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map!: maplibregl.Map;
  
  // Data from query parameters
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
  // Disable hover effects for this results view.
  hover: boolean = false;
  isLoading: boolean = true;

  // Additional country details
  capital: string = 'N/A';
  population: number = 0;
  latitudeCorrect: number = 0;
  longitudeCorrect: number = 0;
  latitudeGuessed: number = 0;
  longitudeGuessed: number = 0;

  // Loading / error states
  loading: boolean = true;
  error: string = '';

  // Map interaction variables
  private hoveredFeatureId: string | number | undefined;
  private clickedFeatureId: string | number | undefined;
  selectedCountry: string = '';
  countryname: string = '';
  countryCoords: [number, number][] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leaderboardService: LeaderboardService
  ) {}

  async ngOnInit(): Promise<void> {
    // Read query parameters
    this.route.queryParams.subscribe(async params => {
      this.flagName = params['flagName'] || '';
      this.flagImage = params['flagImage'] || '';
      this.guessedCountry = params['guessedCountry'] || '';
      this.timeLeft = +params['timeLeft'] || 0;
      this.roundScore = +params['roundScore'] || 0;
      this.totalScore = +params['totalScore'] || 0;
      this.round = +params['currentRound'] || 1;
      this.timePassed = +params['timePassed'] || 0;

      if (!this.flagName) {
        this.loading = false;
        this.error = 'No country name provided';
        return;
      }

      // Fetch details for the correct country (used for additional info and map)
      await this.fetchCountryDetails(this.flagName);

      // Fetch details for the guessed country if provided
      if (this.guessedCountry) {
        await this.fetchGuessedCountryDetails();
      }

      // Update the map bounds once both coordinates are fetched.
      setTimeout(() => {
        this.updateMapBounds();
      }, 1300);

      // Update scores and flags.
      this.totalScore += this.roundScore;
      if (this.guessedCountry === this.flagName) {
        this.istrue = true;
      }
      if (this.round === 10) {
        this.isFinal = true;
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    setTimeout(() => {
      this.isLoading = false;
    }, 1800);
  }

  // Fetch correct country details (including coordinates, capital, etc.)
  async fetchCountryDetails(countryName: string): Promise<void> {
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching details for ${countryName}`);
      }
      const data = await response.json();
      const countryData = data[0];
      this.capital = (countryData.capital && countryData.capital.length > 0) ? countryData.capital[0] : 'N/A';
      this.population = countryData.population || 0;
      if (countryData.latlng && countryData.latlng.length >= 2) {
        // Note: REST Countries API returns [lat, lng]
        this.latitudeCorrect = countryData.latlng[0];
        this.longitudeCorrect = countryData.latlng[1];
      }
      this.loading = false;
    } catch (err) {
      console.error('Error fetching country details:', err);
      this.error = 'Failed to fetch country details';
      this.loading = false;
    }
  }

  // Fetch guessed country details (for its coordinates)
  async fetchGuessedCountryDetails(): Promise<void> {
    if (!this.guessedCountry) return;
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(this.guessedCountry)}?fullText=true`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching details for ${this.guessedCountry}`);
      }
      const data = await response.json();
      const countryData = data[0];
      if (countryData.latlng && countryData.latlng.length >= 2) {
        this.latitudeGuessed = countryData.latlng[0];
        this.longitudeGuessed = countryData.latlng[1];
      }
    } catch (err) {
      console.error('Error fetching guessed country details:', err);
    }
  }

  // Initialize the map and load the GeoJSON for country borders.
  initializeMap(): void {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=jo4L1ZLMvxrPverTEv7H',
      center: [2, 45],
      zoom: 3,
      attributionControl: false
    });
    this.map.addControl(new maplibregl.NavigationControl());
    this.map.on('load', () => {
      this.loadGeoJson();
      // After the map is loaded wait 2 seconds to update bounds if coordinates are ready.
      setTimeout(() => {
        this.updateMapBounds();
      }, 1300);
    });
  }

  // Load the GeoJSON data for country borders.
  private loadGeoJson(): void {
    const geoJsonUrl = 'data/borders.json';
    fetch(geoJsonUrl)
      .then(response => response.json())
      .then(geoJsonData => {
        // Assign a unique ID to each feature.
        geoJsonData.features.forEach((feature: any, index: number) => {
          feature.id = index;
        });
        this.map.addSource('countries', {
          type: 'geojson',
          data: geoJsonData
        });

        // Build the fill expression based on the provided country names.
        const fillColorExpression = [
          'case',
          // Always color the correct country green.
          ['==', ['get', 'NAME'], this.flagName], '#00ff00',
          // Color the guessed country red.
          ['==', ['get', 'NAME'], this.guessedCountry], '#ff0000',
          // If hover effects were enabled, add those (here disabled).
          this.hover
            ? ['case',
                ['boolean', ['feature-state', 'hover'], false], '#ffff00',
                ['boolean', ['feature-state', 'click'], false], '#ffff00',
                'rgba(0,0,0,0)']
            : 'rgba(0,0,0,0)'
        ];

        this.map.addLayer({
          id: 'countries-layer',
          type: 'fill',
          source: 'countries',
          layout: {},
          paint: {
            'fill-color': fillColorExpression as maplibregl.ExpressionSpecification,
            'fill-opacity': 0.5
          }
        });

        // Setup mouse events.
        this.map.on('mousemove', 'countries-layer', (e) => this.highlightFeature(e));
        this.map.on('mouseleave', 'countries-layer', (e) => this.resetHighlight(e));
        this.map.on('click', 'countries-layer', (e) => this.clickFeature(e));
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
        alert('Error loading the map data.');
      });
  }

  // Highlight a country when hovering.
  private highlightFeature(e: maplibregl.MapMouseEvent): void {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['countries-layer'] });
    if (features.length > 0) {
      const newHoveredId = features[0].id;
      if (this.hoveredFeatureId !== undefined && this.hoveredFeatureId !== newHoveredId) {
        this.map.setFeatureState({ source: 'countries', id: this.hoveredFeatureId }, { hover: false });
      }
      this.hoveredFeatureId = newHoveredId;
      this.map.setFeatureState({ source: 'countries', id: this.hoveredFeatureId }, { hover: true });
      this.countryname = features[0].properties['NAME'];
    }
  }

  // Remove hover state when the mouse leaves.
  private resetHighlight(e: maplibregl.MapMouseEvent): void {
    if (this.hoveredFeatureId !== undefined) {
      this.map.setFeatureState({ source: 'countries', id: this.hoveredFeatureId }, { hover: false });
      this.hoveredFeatureId = undefined;
    }
  }

  // Handle a click on a country.
  private clickFeature(e: maplibregl.MapMouseEvent): void {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['countries-layer'] });
    if (features.length > 0) {
      const newClickedId = features[0].id;
      if (this.clickedFeatureId !== undefined && this.clickedFeatureId !== newClickedId) {
        this.map.setFeatureState({ source: 'countries', id: this.clickedFeatureId }, { click: false });
      }
      this.clickedFeatureId = newClickedId;
      this.map.setFeatureState({ source: 'countries', id: this.clickedFeatureId }, { click: true });
      this.selectedCountry = features[0].properties['NAME'];
    }
  }

  // Adjust the map to fit the provided coordinates.
  fitMapToBounds(map: maplibregl.Map, coords: [number, number][]): void {
    if (!map || coords.length < 1) {
      console.error("Map not initialized or insufficient coordinates provided.");
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    coords.forEach(coord => bounds.extend(new maplibregl.LngLat(coord[0], coord[1])));
    map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 3,
      minZoom: 2,
      linear: false,
      duration: 1800
    });
  }

  // Check if a coordinate is inside the current map viewport
  updateMapBounds(): void {
    // Ensure the map is loaded before attempting to update bounds
    if (!this.map || !this.map.loaded()) {
      if (this.map) {
        this.map.once('load', () => this.updateMapBounds());
      }
      return;
    }
  
    let coords: [number, number][] = [];
  
    if (this.longitudeCorrect && this.latitudeCorrect) {
      coords.push([this.longitudeCorrect, this.latitudeCorrect]);
    }
  
    if (this.longitudeGuessed && this.latitudeGuessed) {
      coords.push([this.longitudeGuessed, this.latitudeGuessed]);
    }
  
    // Always adjust the bounds if we have valid coordinates
    if (coords.length > 0) {
      this.fitMapToBounds(this.map, coords);
    }
  }
  

  // Navigation and leaderboard functions
  goToNextRound(): void {
    this.round++;
    this.router.navigate(['/flags'], { 
      queryParams: { totalScore: this.totalScore, round: this.round, timePassed: this.timePassed }
    });
  }

  saveScore(): void {
    const playerName = prompt("Enter your name:");
    if (!playerName) return;
    const newEntry: LeaderboardEntry = {
      name: playerName,
      score: this.totalScore,
      time: `${Math.floor(this.timePassed / 60)}m ${this.timePassed % 60}s`,
      mode: 'Flags Mode'
    };
    this.leaderboardService.addEntry(newEntry);
    this.timePassed = 0;
  }

  goToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  restartGame(): void {
    this.router.navigate(['/flags']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
