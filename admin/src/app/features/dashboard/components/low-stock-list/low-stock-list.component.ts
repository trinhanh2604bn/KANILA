import { Component, input } from '@angular/core';

export interface LowStockItem {
  name: string;
  sku: string;
  stock: number;
  threshold: number;
}

@Component({
  selector: 'app-low-stock-list',
  standalone: true,
  templateUrl: './low-stock-list.component.html',
  styleUrl: './low-stock-list.component.css',
})
export class LowStockListComponent {
  items = input<LowStockItem[]>([]);
}
