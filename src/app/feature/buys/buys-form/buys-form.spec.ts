import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuysForm } from './buys-form';

describe('BuysForm', () => {
  let component: BuysForm;
  let fixture: ComponentFixture<BuysForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuysForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuysForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
