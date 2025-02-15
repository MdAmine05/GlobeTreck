import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import * as maplibregl from 'maplibre-gl';
import { LeaderboardService } from '../../../services/leaderboard.service';

export interface LeaderboardEntry {
  name: string;
  score: number;
  time: string;
  mode: string;
}


@Component({
  selector: 'app-resultslandmarks',
  imports: [CommonModule],
  templateUrl: './resultslandmarks.component.html',
  styleUrl: './resultslandmarks.component.css'
})
export class ResultslandmarksComponent {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map: any;
  streetViewLocation: any;
  //no answer
  NoAnswer: boolean = true;
  clickedLocation: any;
  distance: any = null;
  timeLeft: number = 0;
  roundScore: number = 0;
  totalScore: number = 0;
  round: number = 1;
  isFinal: boolean = false;
  timePassed: number = 0;
  myclick: any = null;
  private markerImagePath = '/images/Pennant.jpg'; // Update with your image path
  constructor(private route: ActivatedRoute,private router:Router,private leaderboardService: LeaderboardService){}
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {//using the params we get from the previous component
      // Retrieve both locations from query params and data
      this.streetViewLocation = {
        latitude: +params['streetViewLat'],
        longitude: +params['streetViewLng']
      };
      this.NoAnswer = params['NoAnswer']==='true';
      if(this.NoAnswer){
        this.clickedLocation = null;
      }else{
        this.distance = Math.round(+params['Distance']);
        this.clickedLocation = {
          latitude: +params['clickedLat'],
          longitude: +params['clickedLng']
        };
      }
      this.timeLeft = +params['timeLeft'] || 0;
      this.roundScore = +params['roundScore'];
      this.totalScore = +params['totalScore'];
      this.round = +params['currentRound'] || 1;
      this.timePassed = +params['timePassed'] || 0;
    });
    if (this.round == 5) {
      this.isFinal = true;
    }
  }
  ngAfterViewInit(): void {
    this.initializeMap();
  }
  initializeMap() {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=jo4L1ZLMvxrPverTEv7H',
      center: [2, 45],
      zoom: 3,
      attributionControl: false
    });
    this.map.addControl(new maplibregl.NavigationControl());
    this.map.on('load', () => {
      if(this.NoAnswer){
        new maplibregl.Marker({ color: 'blue' })
        .setLngLat([this.streetViewLocation.longitude, this.streetViewLocation.latitude])
        .addTo(this.map);
        // Fly to the correct location
        this.map.flyTo({
          center: [this.streetViewLocation.longitude, this.streetViewLocation.latitude],
          zoom: 5,
          speed: 0.8,
          curve: 1,
          essential: true
       });
      }else{
        this.addCustomMarker(this.clickedLocation.longitude, this.clickedLocation.latitude);
        new maplibregl.Marker({ color: 'blue' })
        .setLngLat([this.streetViewLocation.longitude, this.streetViewLocation.latitude])
        .addTo(this.map);

      this.drawLine(); // Call the drawLine function (renamed for clarity)
      };
    })
      
  }

      splitLineSegment(start: number[], end: number[]): number[][] {
        const lngDiff = Math.abs(end[0] - start[0]);
    
        if (lngDiff > 180) {
          const midLng = (start[0] + end[0] + (start[0] > end[0] ? 360 : -360)) / 2;
          const midPoint = [midLng, (start[1] + end[1]) / 2];
          const segment1 = [start, midPoint];
          const segment2 = [midPoint, end];
    
          return this.splitLineSegment(segment1[0], segment1[1]).concat(this.splitLineSegment(segment2[0], segment2[1]));
        } else {
          return [start, end];
        }
      }

      splitLine(coordinates: number[][]): number[][] {
        let splitCoordinates: number[][] = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
          const segment = this.splitLineSegment(coordinates[i], coordinates[i + 1]);
          if (segment && segment[0] && segment[0][0] && segment[0][1]) {
            splitCoordinates.push(...segment);
          }
        }
        return splitCoordinates;
      }

      drawLine() {  // Renamed from linebetween
        const lineCoordinates = [
          [this.clickedLocation.longitude, this.clickedLocation.latitude],
          [this.streetViewLocation.longitude, this.streetViewLocation.latitude]
        ];
    
        const splitCoords = this.splitLine(lineCoordinates); // Split the line!
    
        const geojsonData = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: splitCoords // Use the split coordinates
          }
        };
    
        this.map.addSource('line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: splitCoords
            }
          }
        });
    
        this.map.addLayer({
          id: 'lineLayer',
          type: 'line',
          source: 'line',
          paint: {
            'line-color': '#000000', // Changed to black
            'line-width': 1.5,
            'line-dasharray': [3, 3], // Adjust dash pattern [dash length, gap length]
            'line-opacity': 0.8
          },
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          }
        });
    
        // Fit bounds to the split coordinates
        const bounds = new maplibregl.LngLatBounds();
        splitCoords.forEach(coord => {
          bounds.extend(new maplibregl.LngLat(coord[0], coord[1])); // Use LngLat object
        });
        this.map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1500
        });
      }
      goToNextRound(): void {
        // Increment the round counter
        this.round++;
        // For example, navigate back to the flags mode component.
        this.router.navigate(['/landmarks'], { 
          queryParams: { totalScore : this.totalScore, round: this.round , timePassed: this.timePassed}
        });
      }
      goHome(): void {
        this.router.navigate(['/']);
      }
      goToLeaderboard(): void {
        this.router.navigate(['/leaderboard']); 
      }
      saveScore() {
            const playerName = prompt("Enter your name:");
            if (!playerName) return;
        
        
            const newEntry: LeaderboardEntry = {
              name: playerName,
              score: this.totalScore,
              time: `${Math.floor( this.timePassed / 60)}m ${this.timePassed % 60}s`,
              mode: 'Landmark Mode'
            };
        
            this.leaderboardService.addEntry(newEntry);
            this.timePassed = 0;
      }
      addCustomMarker(lng: number, lat: number) {
            // Store the marker reference
            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
      
            // Create an img element instead of using background-image
            const markerImg = document.createElement('img');
            markerImg.src = this.markerImagePath;
            markerImg.alt = 'Marker';
            markerImg.style.width = '32px'; 
            markerImg.style.height = '32px';
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