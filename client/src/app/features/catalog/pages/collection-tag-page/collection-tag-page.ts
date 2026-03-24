import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalog-collection-tag-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './collection-tag-page.html',
  styleUrl: './collection-tag-page.css',
})
export class CatalogCollectionTagPageComponent {}
