import { Component, AfterViewInit, Output, Input, EventEmitter, ViewChild, ElementRef , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-flagsm',
  imports: [CommonModule],
  templateUrl: './flagsm.component.html',
  styleUrls: ['./flagsm.component.css']
})
export class FlagsMComponent implements AfterViewInit , OnInit {
  @Output() name: EventEmitter<string> = new EventEmitter();
  @Input() correctCountry: string = '';
  @Input() falseCountry: string = '';
  @Input() hover: boolean = true;
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private map!: maplibregl.Map;
  
  // Variable to store the currently hovered country (for hover effects)
  private hoveredFeatureId: string | number | undefined;
  // Variable to store the currently clicked country (for click effects)
  private clickedFeatureId: string | number | undefined;
  
  selectedCountry: string = '';
  countryname: string = '';
  longitudeCorrect: number = 0;
  latitudeCorrect: number = 0;
  longitudeGuessed: number = 0;
  latitudeGuessed: number = 0;
  countryCoords: [number, number][] = [];

  constructor() { }

  ngOnInit(): void {
    this.fetchCountryCorrect();
    this.fetchCountryDetails();
  }
  

  ngAfterViewInit(): void {
    this.initializeMap();
    if (this.correctCountry && this.falseCountry) {
      this.countryCoords = [ [this.longitudeCorrect, this.latitudeCorrect] , [this.longitudeGuessed, this.latitudeGuessed] ];
      this.fitMapToBounds(this.map, this.countryCoords);
      console.log('1:');
    }
    else if(this.correctCountry){
      this.fitMapToBounds(this.map, [ [this.longitudeCorrect, this.latitudeCorrect] , [this.longitudeCorrect, this.latitudeCorrect] ] );
      // Add these before calling fitMapToBounds
      console.log('2:' + this.countryCoords);
    }

    console.log('3:' + this.countryCoords + ' ' + this.correctCountry + ' ' + this.falseCountry);
  }

  async initializeMap() {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=jo4L1ZLMvxrPverTEv7H',
      center: [2, 30], // Initial view (longitude, latitude)
      zoom: 3, // Initial zoom level
      attributionControl: false
    });
    this.map.addControl(new maplibregl.NavigationControl());
    this.map.on('load', () => {
      this.loadGeoJson();
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
            ['==', ['get', 'NAME'], this.correctCountry], '#00ff00',
            // Always fill the false country with red:
            ['==', ['get', 'NAME'], this.falseCountry], '#ff0000',
            // Otherwise, keep transparent:
            'rgba(0,0,0,0)'
          ];
        } else {
          // When hover effects are enabled, include hover in the expression.
          fillColorExpression = [
            'case',
            // Persistent highlight for correct and false countries:
            ['==', ['get', 'NAME'], this.correctCountry], '#00ff00',
            ['==', ['get', 'NAME'], this.falseCountry], '#ff0000',
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
      this.name.emit(this.selectedCountry);
    }
  }

  async fetchCountryDetails(): Promise<void> {
    if (this.falseCountry) {
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(this.falseCountry)}?fullText=true`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error fetching details for ${this.falseCountry}`);
        }
        const data = await response.json();
        const countryData = data[0];
        if (countryData.latlng && countryData.latlng.length >= 2) {
          // API returns [lat, lng] so assign accordingly.
          this.latitudeGuessed = countryData.latlng[0];
          this.longitudeGuessed = countryData.latlng[1];
          console.log(`Guessed country (${this.falseCountry}) coordinates: [${this.longitudeGuessed}, ${this.latitudeGuessed}]`);
        } else {
          console.error('LatLng data missing for guessed country.');
        }
        // Update bounds if both coordinates are available.
        this.updateMapBounds();
      } catch (err) {
        console.error('Error fetching guessed country details:', err);
      }
    }
  }
  
  async fetchCountryCorrect(): Promise<void> {
    if (this.correctCountry) {
      const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(this.correctCountry)}?fullText=true`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error fetching details for ${this.correctCountry}`);
        }
        const data = await response.json();
        const countryData = data[0];
        if (countryData.latlng && countryData.latlng.length >= 2) {
          // API returns [lat, lng] so assign accordingly.
          this.latitudeCorrect = countryData.latlng[0];
          this.longitudeCorrect = countryData.latlng[1];
          console.log(`Correct country (${this.correctCountry}) coordinates: [${this.longitudeCorrect}, ${this.latitudeCorrect}]`);
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
  fitMapToBounds(map: maplibregl.Map, coords: [number, number][]) {
    if (!map || coords.length < 2) {
      console.error("Map not initialized or not enough coordinates provided.");
      return;
    }
  
    const bounds = new maplibregl.LngLatBounds();
  
    coords.forEach(coord => {
      bounds.extend(new maplibregl.LngLat(coord[0], coord[1]));
    });
  
    // Calculate better padding based on the viewport size
    const viewport = map.getContainer().getBoundingClientRect();
    const dynamicPadding = Math.min(viewport.width, viewport.height) * 0.2; // 20% of viewport

    map.fitBounds(bounds, {
      padding: {
        top: dynamicPadding * 0.5,
        bottom: dynamicPadding * 2.3,
        left: dynamicPadding,
        right: dynamicPadding
      },
      duration: 2000, 
      maxZoom: 2,         // Reduced max zoom to prevent getting too close
      minZoom: 2,         // Added min zoom to maintain context
      linear: false,      // Smooth easing
      essential: true     // Makes the animation more reliable
    });
}
  
  updateMapBounds(): void {
    // Check if both coordinates exist (assuming 0 means not set)
    if (this.longitudeGuessed && this.latitudeGuessed && this.longitudeCorrect && this.latitudeCorrect) {
      this.countryCoords = [
        [this.longitudeGuessed, this.latitudeGuessed],
        [this.longitudeCorrect, this.latitudeCorrect]
      ];

      // Now call the function to fit the map bounds.
      this.fitMapToBounds(this.map, this.countryCoords);
    }
  }
}