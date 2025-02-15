import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectModeComponent } from './select-mode.component';

describe('SelectModeComponent', () => {
  let component: SelectModeComponent;
  let fixture: ComponentFixture<SelectModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
