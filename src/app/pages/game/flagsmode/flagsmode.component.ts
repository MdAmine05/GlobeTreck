import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { FlagsService, Flag } from '../../../services/flags.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FlagsMComponent } from '../flags-maplibre/flagsm.component';

@Component({
  selector: 'app-flagsmode',
  imports: [CommonModule, FlagsMComponent],
  templateUrl: './flagsmode.component.html',
  styleUrls: ['./flagsmode.component.css']
})
export class FlagsmodeComponent implements OnInit, OnDestroy {
  currentFlag: Flag | null = null;    // Holds the current flag
  flags: Flag[] = [];                 // List of available flags
  guessedCountryName: string = '';    // Country name retrieved via reverse geocoding
  isDropdownOpen = false;
  selectedCoordinates: { lat: number, lng: number } | null = null;
 
  setSelectedCoordinates(coords: { lat: number, lng: number }): void {
    this.selectedCoordinates = coords;
    // this.onReverseGeocode();  // Automatically call reverse geocoding when coordinates are updated
  }
  setGuessedCountryName(name: string): void {
    this.guessedCountryName = name;
  }

  // Timer Variables
  timer: number = 124;  // 2 minutes per round
  intervalId: any;
  isLoading: boolean = true;

  // Scoring Variables
  totalScore: number = 0; // Accumulates the total score across rounds
  currentRound: number = 1; // Current round number
  roundscore: number = 0; // Score for the current round
  totalRounds: number = 10; // Total number of rounds
  timePassed: number = 0; // Time passed in seconds

  private platformId = inject(PLATFORM_ID);

  constructor(
    private flagService: FlagsService,
    private router: Router,  // Inject Router for navigation
    private route : ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.flagService.getFlags().subscribe((response: { flags: Flag[] }) => {
      this.flags = response.flags;
      this.startNewRound();
      this.loadMap();
    });

    this.route.queryParams.subscribe(params => {
      if (params['round']) {
        this.currentRound = params['round'];
      }
      if (params['totalScore']) {
        this.totalScore = params['totalScore'];
      }
      if (params['timePassed']) {
        this.timePassed = params['timePassed'];
      }
    }); 


  }
    //loading screen
    loadMap() {
      // Simulating street view loading delay
      setTimeout(() => {
        this.isLoading = false; // Hide loading screen when the map loads
      }, 4000); // Adjust this delay if necessary
    }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ----------- Timer Functions -----------
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
    alert("Time is up! Moving to next round.");
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
    this.currentFlag = this.getRandomFlag();
    this.guessedCountryName = '';
    this.selectedCoordinates = null;
    this.resetTimer();
  }

  getRandomFlag(): Flag {
    const randomIndex = Math.floor(Math.random() * this.flags.length);
    return this.flags[randomIndex];
  }

  // Reverse Geocoding: Use the selected coordinates to get the country name.
  // onReverseGeocode(): void {
  //   if (!this.selectedCoordinates) return;
  //   const { lat, lng } = this.selectedCoordinates;
  //   const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  //   fetch(url)
  //     .then(response => response.json())
  //     .then(data => {
  //       const country = data.address && data.address.country ? data.address.country : '';
  //       if (country) {
  //         this.guessedCountryName = country;
  //         console.log('Guessed country:', country);
  //       } else {
  //         console.error('Country not found in reverse geocoding result.');
  //         this.guessedCountryName = '';
  //       }
  //     });
  // }

  // ----------- Finish Round and Send Data to Results Page -----------
  finishRound(): void {
    // Stop the timer (if it hasn't already been stopped)
    this.stopTimer();
    

    // Calculate the round's score:
    // Normalize strings for comparison.
    const normalizedGuess = this.guessedCountryName.trim().toLowerCase();
    const normalizedAnswer = this.currentFlag ? this.currentFlag.name.trim().toLowerCase() : '';
    let roundScore = 0;
    if (normalizedGuess && normalizedGuess === normalizedAnswer) {
      // Correct guess: base score 100 + bonus for time remaining.
      roundScore = 100 + this.timer;
    }


    // Prepare query parameters to send to the results page.
    // Population and capital will be fetched in the results page.
    const queryParams = {
      flagName: this.currentFlag ? this.currentFlag.name : '',
      flagImage: this.currentFlag ? this.currentFlag.source : '',
      guessedCountry: this.guessedCountryName,
      timeLeft: this.timer ,
      roundScore: roundScore,
      currentRound : this.currentRound,
      totalScore: this.totalScore,
      timePassed: this.timePassed
    };

    // Navigate to the results page with the query parameters.
    this.router.navigate(['resultsflags'], { queryParams });
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


 

