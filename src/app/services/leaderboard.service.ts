import { Injectable } from '@angular/core';

export interface LeaderboardEntry {
  name: string;
  score: number;
  time: string;
  mode: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private storageKey = 'leaderboard';

  constructor() {}

  // ✅ Get all entries, optionally filtering by mode
  getLeaderboard(mode?: string): LeaderboardEntry[] {
    const data = localStorage.getItem(this.storageKey);
    let leaderboard = data ? JSON.parse(data) : [];

    if (mode) {
      return leaderboard.filter((entry: LeaderboardEntry) => entry.mode === mode);
    }
    
    return leaderboard;
  }

  // ✅ Add a new entry
  addEntry(entry: LeaderboardEntry): void {
    let leaderboard = this.getLeaderboard();
    leaderboard.push(entry);

    // Sort by highest score
    leaderboard.sort((a, b) => b.score - a.score);

    localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
  }

  // ✅ Clear only entries for a specific mode
  clearLeaderboard(mode: string): void {
    let leaderboard = this.getLeaderboard().filter(entry => entry.mode !== mode);
    localStorage.setItem(this.storageKey, JSON.stringify(leaderboard));
  }
}
