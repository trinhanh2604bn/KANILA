import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalog-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})
export class CatalogSearchPageComponent {}
