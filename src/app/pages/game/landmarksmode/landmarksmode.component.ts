import { Component, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import{SvMaplibreComponent} from '../sv-maplibre/sv-maplibre.component';
import { LandmarksService } from '../../../services/landmarks.service';
@Component({
  selector: 'app-landmarksmode',
  imports: [CommonModule,SvMaplibreComponent],
  templateUrl: './landmarksmode.component.html',
  styleUrl: './landmarksmode.component.css'
})

export class LandmarksmodeComponent {
  @Output() locationSelected = new EventEmitter<any>();
  isLoading: boolean = true;
  mycurrentlocation: any;
  clickedLocation: any;
  distance: any = null;
  //no answer
  NoAnswer: boolean = true;
  // Timer Variables
  timer: number = 124;  // 2 minutes per round
  intervalId: any;
  // Scoring Variables
  totalScore: number = 0; // Accumulates the total score across rounds
  currentRound: number = 1; // Current round number
  roundscore: number = 0; // Score for the current round
  totalRounds: number = 5; // Total number of rounds
  timePassed: number = 0; // Time passed in seconds
  isDropdownOpen = false;
  constructor(
    private randomsv: LandmarksService,
    private router: Router,
    private route : ActivatedRoute) {}
  ngOnInit(): void {
    this.startNewRound();
    this.route.queryParams.subscribe(params => {
      if (params['round']) {
        this.currentRound = +params['round'];
      }
      if (params['totalScore']) {
        this.totalScore = +params['totalScore'];
      }
      if (params['timePassed']) {
        this.timePassed = +params['timePassed'];
      }
    });
    this.loadStreetView();
  }
  ngAfterViewInit(): void {
    this.initializeVIEW();
  }
  ngOnDestroy(): void {
    this.stopTimer();
  }
  startTimer(): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
        this.timePassed++;
      } else {
        this.timeUp();
      }
    }, 1000);
  }
  //loading screen
  loadStreetView() {
    // Simulating street view loading delay
    setTimeout(() => {
      this.isLoading = false; // Hide loading screen when street view loads
    }, 4000); // Adjust this delay if necessary
  }
  stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  resetTimer(): void {
    this.timer = 124;
    this.startTimer();
  }
  timeUp(): void {
    this.stopTimer();
    // When time is up, consider the round as finished with 0 points.
    this.finishRound();
  }
  get minutes(): number {
    return Math.floor(this.timer / 60);
  }

  get seconds(): number {
    return this.timer % 60;
  }
  // ----------- Game Functions -----------
  startNewRound(): void {
    this.resetTimer();
  }
  finishRound(): void {
    // Stop the timer (if it hasn't already been stopped)
    this.stopTimer();
    if(this.NoAnswer){
      this.router.navigate(['resultslandmarks'], {
        queryParams: {
          NoAnswer:this.NoAnswer,
          streetViewLat: this.mycurrentlocation.latitude,
          streetViewLng: this.mycurrentlocation.longitude,
          timeLeft: this.timer,
          roundScore: 0,
          currentRound: this.currentRound,
          totalScore: this.totalScore,
          timePassed: this.timePassed,
        }
      });
    }else{
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const lat1 = this.mycurrentlocation.latitude * Math.PI / 180;
      const lat2 = this.clickedLocation.latitude * Math.PI / 180;
      const dLat = (this.clickedLocation.latitude - this.mycurrentlocation.latitude) * Math.PI / 180;
      const dLon = (this.clickedLocation.longitude - this.mycurrentlocation.longitude) * Math.PI / 180;

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      this.distance = R * c; // Distance in kilometers

      // New scoring system
      // Max distance score is 1000 points, reduces to 0 beyond 2000km
      let distanceScore = 0;
      let timeBonus = 0;
      const maxDistance = 2000; // Beyond this, score is 0
      const minDistance = 1; // Minimum distance for full score
      const maxScore = 1000; // Max possible distance score
      distanceScore = Math.round(maxScore * Math.exp(-this.distance / maxDistance) );// Logarithmic decay
      if (this.distance > 5000) distanceScore = 0; // Cap at 5000km
      // Time bonus - max 500 points for quick answers
      const maxTimeBonus = 500;
      const timeFactor = 2; // Adjust this to tweak the time decay curve
      const timeDecay = Math.exp(-this.timePassed / (120 / timeFactor));
      timeBonus = Math.round(distanceScore * (maxTimeBonus / maxScore) * timeDecay);
      // Calculate final round score
      const roundScore = distanceScore + timeBonus;
      this.totalScore += roundScore;

        this.router.navigate(['resultslandmarks'], {
          queryParams: {
            NoAnswer:this.NoAnswer,
            streetViewLat: this.mycurrentlocation.latitude,
            streetViewLng: this.mycurrentlocation.longitude,
            clickedLat: this.clickedLocation.latitude,
            clickedLng: this.clickedLocation.longitude,
            Distance: this.distance,
            timeLeft: this.timer,
            roundScore: roundScore,
            currentRound: this.currentRound,
            totalScore: this.totalScore,
            timePassed: this.timePassed,
            distance: Math.round(this.distance * 100) / 100 // Round to 2 decimal places
          }
        });
    }
  }


  onLocationClicked(event: {location: any, noAnswer: boolean}) {
    this.clickedLocation = event.location;
    this.NoAnswer=event.noAnswer;
  }


  async initializeVIEW() {
    this.mycurrentlocation = await this.randomsv.getRandomLocation();//wait for service to fetch streetviews
    document.getElementById('holder')!.innerHTML = this.mycurrentlocation.iframe;
  }
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    const navElement = document.querySelector('.nav');
    if (this.isDropdownOpen) {
      navElement?.classList.add('menu-open');
    } else {
      navElement?.classList.remove('menu-open');
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  navigateToLeaderbord() {
    // Add restart logic here
    this.router.navigate(['leaderboard']);
  }

  quitGame() {
      this.router.navigate(['/select-mode']);
      this.isDropdownOpen = false;
  }
}