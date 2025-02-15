import { TestBed } from '@angular/core/testing';

import { RandomstreetviewsService } from './randomstreetviews.service';

describe('RandomstreetviewsService', () => {
  let service: RandomstreetviewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RandomstreetviewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
