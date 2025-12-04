import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleView } from './sale-view';

describe('SaleView', () => {
  let component: SaleView;
  let fixture: ComponentFixture<SaleView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
