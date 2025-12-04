import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuysList } from './buys-list';

describe('BuysList', () => {
  let component: BuysList;
  let fixture: ComponentFixture<BuysList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuysList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuysList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
