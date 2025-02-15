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
  // Disable hover effects for the results view
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

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.flagName = params['flagName'] || '';
      this.flagImage = params['flagImage'] || '';
      this.guessedCountry = params['guessedCountry'] || '';
      this.timeLeft = +params['timeLeft'] || 0;
      this.roundScore = +params['roundScore'] || 0;
      this.totalScore = +params['totalScore'] || 0;
      this.round = +params['currentRound'] || 1;
      this.timePassed = +params['timePassed'] || 0;

      if (this.flagName) {
        // Fetch details for the correct country
        this.fetchCountryDetails(this.flagName);
        // Fetch details for the guessed country (if provided)
        this.fetchGuessedCountryDetails();
      } else {
        this.loading = false;
        this.error = 'No country name provided';
      }
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

  async fetchCountryDetails(countryName: string): Promise<void> {
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching details for ${countryName}`);
      }
      const data = await response.json();
      const countryData = data[0];
      this.capital = countryData.capital && countryData.capital.length > 0 ? countryData.capital[0] : 'N/A';
      this.population = countryData.population || 0;
      if (countryData.latlng && countryData.latlng.length >= 2) {
        // REST Countries API returns [lat, lng]
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

  async fetchGuessedCountryDetails(): Promise<void> {
    if (this.guessedCountry) {
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
  }

  initializeMap(): void {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=ux7U0JoDzUbunhk0mxHh',
      center: [2, 45],
      zoom: 3,
      attributionControl: false
    });
    this.map.addControl(new maplibregl.NavigationControl());
    this.map.on('load', () => {
      this.loadGeoJson();
      // Always bound the markers after the map (and GeoJSON) have loaded
      setTimeout(() => {
        this.boundMarkers();
      }, 1300);
    });
  }

  private loadGeoJson(): void {
    const geoJsonUrl = 'data/borders.json';
    fetch(geoJsonUrl)
      .then(response => response.json())
      .then(geoJsonData => {
        // Assign a unique ID to each feature
        geoJsonData.features.forEach((feature: any, index: number) => {
          feature.id = index;
        });
        this.map.addSource('countries', {
          type: 'geojson',
          data: geoJsonData
        });

        const fillColorExpression = [
          'case',
          // Always fill the correct country with green:
          ['==', ['get', 'NAME'], this.flagName], '#00ff00',
          // Always fill the guessed country with red:
          ['==', ['get', 'NAME'], this.guessedCountry], '#ff0000',
          // Hover effects (disabled here)
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

        // Set up mouse events for interactivity
        this.map.on('mousemove', 'countries-layer', (e) => this.highlightFeature(e));
        this.map.on('mouseleave', 'countries-layer', (e) => this.resetHighlight(e));
        this.map.on('click', 'countries-layer', (e) => this.clickFeature(e));
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
        alert('Error loading the map data.');
      });
  }

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

  private resetHighlight(e: maplibregl.MapMouseEvent): void {
    if (this.hoveredFeatureId !== undefined) {
      this.map.setFeatureState({ source: 'countries', id: this.hoveredFeatureId }, { hover: false });
      this.hoveredFeatureId = undefined;
    }
  }

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

  // ─── NEW BOUNDING LOGIC (COPIED FROM STREET VIEW) ─────────────────────────
  private boundMarkers(): void {
    if (!this.map || !this.map.loaded()) {
      if (this.map) {
        this.map.once('load', () =>setTimeout(() => {
          this.boundMarkers();
        }, 1300));
      }
      return;
    }
    // If both guessed and correct coordinates exist, mimic the line logic
    if (this.guessedCountry && this.latitudeGuessed && this.longitudeGuessed) {
      const lineCoordinates = [
        [this.longitudeGuessed, this.latitudeGuessed],
        [this.longitudeCorrect, this.latitudeCorrect]
      ];
      const splitCoords = this.splitLine(lineCoordinates);
      const bounds = new maplibregl.LngLatBounds();
      splitCoords.forEach(coord => {
        bounds.extend(new maplibregl.LngLat(coord[0], coord[1]));
      });
      this.map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 3,
        minZoom: 2,
        duration: 1800
      });
    } else if (this.latitudeCorrect && this.longitudeCorrect) {
      // If no guessed country, fly to the correct country’s location
      this.map.flyTo({
        center: [this.longitudeCorrect, this.latitudeCorrect],
        zoom: 3,
        speed: 0.8,
        curve: 1,
        essential: true
      });
    }
  }

  private splitLineSegment(start: number[], end: number[]): number[][] {
    const lngDiff = Math.abs(end[0] - start[0]);
    if (lngDiff > 180) {
      const midLng = (start[0] + end[0] + (start[0] > end[0] ? 360 : -360)) / 2;
      const midPoint = [midLng, (start[1] + end[1]) / 2];
      const segment1 = this.splitLineSegment(start, midPoint);
      const segment2 = this.splitLineSegment(midPoint, end);
      return segment1.concat(segment2);
    } else {
      return [start, end];
    }
  }

  private splitLine(coordinates: number[][]): number[][] {
    let splitCoordinates: number[][] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      const segment = this.splitLineSegment(coordinates[i], coordinates[i + 1]);
      splitCoordinates.push(...segment);
    }
    return splitCoordinates;
  }
  // ─────────────────────────────────────────────────────────────────────────────

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
