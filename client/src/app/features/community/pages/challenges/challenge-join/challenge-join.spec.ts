import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengeJoin } from './challenge-join';

describe('ChallengeJoin', () => {
  let component: ChallengeJoin;
  let fixture: ComponentFixture<ChallengeJoin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengeJoin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengeJoin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
