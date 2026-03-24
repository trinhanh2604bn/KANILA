import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalog-recommendation-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recommendation-page.html',
  styleUrl: './recommendation-page.css',
})
export class CatalogRecommendationPageComponent {}
