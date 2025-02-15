import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagsMComponent } from './flagsm.component';

describe('FlagsComponent', () => {
  let component: FlagsMComponent;
  let fixture: ComponentFixture<FlagsMComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlagsMComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlagsMComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
