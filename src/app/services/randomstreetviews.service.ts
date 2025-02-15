import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RandomstreetviewsService {
  private readonly dataUrl = 'data/Hard-streetviews.json';
  private shuffledLocations: any[] = [];
  private currentIndex = 0; // Track next location
  constructor() { }
  async getRandomLocation() {
    if (this.shuffledLocations.length === 0 || this.currentIndex >= this.shuffledLocations.length) {
      await this.shuffleLocations(); // Shuffle when first call or reset needed
      this.currentIndex = 0;
    }

    return this.shuffledLocations[this.currentIndex++]; // Return next location
  }

  private async shuffleLocations() {//gets all the location and shuffle them (to be set to 5 locations)
    const response = await fetch(this.dataUrl);
    const data = await response.json();
    this.shuffledLocations = this.fisherYatesShuffle(data.locations);
  }

  private fisherYatesShuffle(array: any[]) {//shuffle a given array
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }
}
