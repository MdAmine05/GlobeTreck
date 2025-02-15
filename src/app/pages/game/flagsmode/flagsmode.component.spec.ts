import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagsmodeComponent } from './flagsmode.component';

describe('FlagsmodeComponent', () => {
  let component: FlagsmodeComponent;
  let fixture: ComponentFixture<FlagsmodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlagsmodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlagsmodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
