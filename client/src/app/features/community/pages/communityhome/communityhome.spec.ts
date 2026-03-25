import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Communityhome } from './communityhome';

describe('Communityhome', () => {
  let component: Communityhome;
  let fixture: ComponentFixture<Communityhome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Communityhome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Communityhome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
