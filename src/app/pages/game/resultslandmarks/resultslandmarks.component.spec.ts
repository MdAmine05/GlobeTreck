import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultslandmarksComponent } from './resultslandmarks.component';

describe('ResultslandmarksComponent', () => {
  let component: ResultslandmarksComponent;
  let fixture: ComponentFixture<ResultslandmarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultslandmarksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultslandmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
