import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreetviewmodeComponent } from './streetviewmode.component';

describe('StreetviewmodeComponent', () => {
  let component: StreetviewmodeComponent;
  let fixture: ComponentFixture<StreetviewmodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreetviewmodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreetviewmodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
