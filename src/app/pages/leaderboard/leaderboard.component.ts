import { Component, OnInit } from '@angular/core';
import { LeaderboardService, LeaderboardEntry } from '../../services/leaderboard.service';
import { CommonModule } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  group
} from '@angular/animations';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
  animations: [
    trigger('fade', [
      transition('* => *', [
        query(':enter', [style({ opacity: 0 })], { optional: true }),
        group([
          query(':leave', [animate('0.3s', style({ opacity: 0 }))], {
            optional: true
          }),
          query(':enter', [animate('0.3s', style({ opacity: 1 }))], {
            optional: true
          })
        ])
      ])
    ])
  ]
})
export class LeaderboardComponent implements OnInit {
  modes: string[] = ['Flags Mode', 'Street View Mode', 'Landmark Mode'];
  currentModeIndex: number = 0;
  leaderboardData: LeaderboardEntry[] = [];

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit() {
    this.updateLeaderboard();
  }

  // Fetch leaderboard  for the current mode
  updateLeaderboard() {
    const currentMode = this.modes[this.currentModeIndex];
    this.leaderboardData = this.leaderboardService.getLeaderboard(currentMode);
  }

  // Clear leaderboard for the current mode
  clearLeaderboard() {
    const currentMode = this.modes[this.currentModeIndex];
    this.leaderboardService.clearLeaderboard(currentMode);
    this.updateLeaderboard();
  }

  previousMode() {
    this.currentModeIndex = (this.currentModeIndex === 0) ? this.modes.length - 1 : this.currentModeIndex - 1;
    this.updateLeaderboard();
  }

  nextMode() {
    this.currentModeIndex = (this.currentModeIndex === this.modes.length - 1) ? 0 : this.currentModeIndex + 1;
    this.updateLeaderboard();
  }
}
