import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuysView } from './buys-view';

describe('BuysView', () => {
  let component: BuysView;
  let fixture: ComponentFixture<BuysView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuysView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuysView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
