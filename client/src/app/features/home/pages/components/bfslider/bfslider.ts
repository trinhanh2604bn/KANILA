import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bfslider',
  imports: [RouterLink],
  templateUrl: './bfslider.html',
  styleUrl: './bfslider.css',
})
export class Bfslider {
  csliderValue: number = 50;
  imgBefore: string = '/assets/images/home/before.jpg';
  imgAfter: string = '/assets/images/home/after.jpg';

  moveDivisor(event: Event): void {
    const slider = event.target as HTMLInputElement;
    this.csliderValue = Number(slider.value);
  }
}
