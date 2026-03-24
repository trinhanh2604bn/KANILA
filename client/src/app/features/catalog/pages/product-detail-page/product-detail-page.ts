import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalog-product-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css',
})
export class CatalogProductDetailPageComponent {}
