import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandmarksmodeComponent } from './landmarksmode.component';

describe('LandmarksmodeComponent', () => {
  let component: LandmarksmodeComponent;
  let fixture: ComponentFixture<LandmarksmodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandmarksmodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandmarksmodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
