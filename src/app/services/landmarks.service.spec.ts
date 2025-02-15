import { TestBed } from '@angular/core/testing';

import { LandmarksService } from './landmarks.service'; // Adjust the import path to your service file

describe('LandmarksService', () => {
  let service: LandmarksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandmarksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy(); // Verifies if the service was created successfully
  });
});
