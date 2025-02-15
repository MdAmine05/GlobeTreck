import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvMaplibreComponent } from './sv-maplibre.component';

describe('SvMaplibreComponent', () => {
  let component: SvMaplibreComponent;
  let fixture: ComponentFixture<SvMaplibreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvMaplibreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvMaplibreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
