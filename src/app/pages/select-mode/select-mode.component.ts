import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-selectmode',
  imports: [],
  templateUrl: './select-mode.component.html',
  styleUrl: './select-mode.component.css'
})
export class SelectModeComponent {
  currentBackground: string = 'assets/images/default-bg.jpg';
  selectedMode: string | null = null;
  constructor(private router:Router){}

  public tostreetviewmode(){
    this.router.navigate(['streetview'])
  }
  public tolandmarksmode(){
    this.router.navigate(['landmarks'])
  }
  public toflagsmode(){
    this.router.navigate(['flags'])
  }

  selectMode(mode: string) {
    this.selectedMode = mode;
    switch(mode) {
      case 'street':
        this.currentBackground = '/images/transition-select-mode/street-trans.png';
        break;
      case 'landmark':
        this.currentBackground = '/images/transition-select-mode/landmark-trans.png';
        break;
      case 'flags':
        this.currentBackground = '/images/transition-select-mode/flags-trans.png';
        break;
    }
  }
  startSelectedMode() {
    switch(this.selectedMode) {
      case 'street':
        this.tostreetviewmode();
        break;
      case 'landmark':
        this.tolandmarksmode();
        break;
      case 'flags':
        this.toflagsmode();
        break;
    }
  }
  navigateToHome() {
    this.router.navigate(['/']);
  }
}