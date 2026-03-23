import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { SearchItem } from '../../models/search-item.model';

@Injectable({
  providedIn: 'root'
})
export class SearchApiService {
  private mockIndex: SearchItem[] = [
    { id: '1', title: 'Hydrating Serum 30ml', type: 'product', metadata: '$45.00 • In Stock', route: ['/products', '1'], imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&h=100&fit=crop' },
    { id: '2', title: 'Glow Moisturizer Cream', type: 'product', metadata: '$32.50 • Low Stock', route: ['/products', '2'] },
    { id: '3', title: 'ORD-9022', type: 'order', metadata: 'Emma Watson • $120.50', route: ['/orders', 'ORD-9022'], icon: 'receipt_long' },
    { id: '4', title: 'ORD-8041', type: 'order', metadata: 'John Doe • $45.00', route: ['/orders', 'ORD-8041'], icon: 'receipt_long' },
    { id: '5', title: 'Great product, love the texture', type: 'review', metadata: 'Hydrating Serum • 5 Stars', route: ['/reviews'], icon: 'reviews' },
    { id: '6', title: 'Emma Watson', type: 'customer', metadata: 'emma@example.com • 12 Orders', route: ['/customers', 'C1'], icon: 'person' },
  ];

  search(query: string): Observable<SearchItem[]> {
    if (!query || query.length < 2) return of([]).pipe(delay(200));
    const q = query.toLowerCase();
    const results = this.mockIndex.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.id.toLowerCase().includes(q) ||
      item.metadata.toLowerCase().includes(q)
    );
    return of(results).pipe(delay(400));
  }
}
