import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsflagsComponent } from './resultsflags.component';

describe('ResultsflagsComponent', () => {
  let component: ResultsflagsComponent;
  let fixture: ComponentFixture<ResultsflagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsflagsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultsflagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
