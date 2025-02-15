import { Component, ElementRef, ViewChild, Renderer2, Output, EventEmitter } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
@Component({
  selector: 'app-sv-maplibre',
  imports: [],
  templateUrl: './sv-maplibre.component.html',
  styleUrl: './sv-maplibre.component.css'
})
export class SvMaplibreComponent {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Output() locationClicked = new EventEmitter<{location: any, noAnswer: boolean}>();
  private map!: maplibregl.Map;
  myclick: any = null;
  clickedLocation: any;
  //no answer
  NoAnswer: boolean = true;
  private markerImagePath = '/images/Pennant.jpg'; // Update with your image path
  constructor(private renderer: Renderer2) {}

  

  ngAfterViewInit(): void {
    this.initializeMap();
    this.addHoverEffect();
  }
  
  addHoverEffect(): void {//maps gets bigger on hover while retaining left edge
    if (this.mapContainer) {
      this.renderer.setStyle(this.mapContainer.nativeElement, 'transform-origin', 'bottom left');
      this.renderer.listen(this.mapContainer.nativeElement, 'mouseover', () => {
        this.renderer.setStyle(this.mapContainer.nativeElement, 'transform', 'scale(1.5)');
        this.renderer.setStyle(this.mapContainer.nativeElement, 'transition', 'transform 0.3s ease-in-out');
      });

      this.renderer.listen(this.mapContainer.nativeElement, 'mouseleave', () => {
        this.renderer.setStyle(this.mapContainer.nativeElement, 'transform', 'scale(1)');
      });
    }
  }
  
   async initializeMap() {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=ux7U0JoDzUbunhk0mxHh',
      center: [2, 45], // Initial view (longitude, latitude)
      zoom: 3,
      attributionControl: false // Hide the default attribution control
    });
      this.map.addControl(new maplibregl.NavigationControl());
      
  
      this.map.on('click', (e: any) => {
        this.NoAnswer=false;
        if (this.myclick) {
          this.myclick.remove();
        }
        this.clickedLocation = {
          latitude: e.lngLat.lat,
          longitude: e.lngLat.lng
        };
          this.addCustomMarker(e.lngLat.lng, e.lngLat.lat);
        
        // Emit both location and NoAnswer status
        this.locationClicked.emit({
          location: this.clickedLocation,
          noAnswer: this.NoAnswer
        });
      });
    }
    addCustomMarker(lng: number, lat: number) {
      // Store the marker reference
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';

      // Create an img element instead of using background-image
      const markerImg = document.createElement('img');
      markerImg.src = this.markerImagePath;
      markerImg.alt = 'Marker';
      markerImg.style.width = '25px'; 
      markerImg.style.height = '25px';
      markerElement.appendChild(markerImg);

      // Create and store the marker
      this.myclick = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .addTo(this.map);
    }
    
}
