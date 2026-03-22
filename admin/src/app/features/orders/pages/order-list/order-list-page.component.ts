import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersApiService } from '../../services/orders-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { Order, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-list-page.component.html',
  styleUrl: './order-list-page.component.css'
})
export class OrderListPageComponent implements OnInit {
  private readonly api = inject(OrdersApiService);
  private readonly toast = inject(ToastService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<OrderStatus | 'all'>('all');

  filteredOrders = computed(() => {
    let list = this.orders();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(o => 
        (o.orderNumber || '').toLowerCase().includes(q) || 
        (o.customerName || '').toLowerCase().includes(q)
      );
    }
    const s = this.statusFilter();
    if (s !== 'all') {
      list = list.filter(o => o.status === s);
    }
    return list;
  });

  ngOnInit(): void {
    this.api.getAll().subscribe(data => {
      this.orders.set(data);
      this.loading.set(false);
    });
  }

  formatPrice(val: number): string {
    return (val ?? 0).toLocaleString('vi-VN') + '₫';
  }
}
