import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-divider',
  imports: [RouterLink, NgIf],
  templateUrl: './divider.html',
  styleUrl: './divider.css',
})
export class Divider {
  @Input() title: string = 'SẢN PHẨM MỚI';
  @Input() buttonText: string = 'Xem tất cả';
  /** Target for “Xem tất cả” (e.g. shop listing) */
  @Input() ctaLink: string = '/catalog';
  /** Optional query params for the CTA link */
  @Input() ctaQueryParams: Record<string, string> = {};
}
