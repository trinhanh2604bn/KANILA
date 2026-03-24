import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { MyOrderListItemView } from '../../models/order.model';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-orders-page.html',
  styleUrls: ['./my-orders-page.css'],
})
export class MyOrdersPageComponent implements OnInit {
  orders: MyOrderListItemView[] = [];
  isLoading = true;
  hasError = false;
  selectedStatus = '';
  page = 1;
  totalPages = 1;

  constructor(
    private readonly orderService: OrderService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(page = this.page): void {
    this.isLoading = true;
    this.hasError = false;
    this.orderService.getMyOrders(page, 10, this.selectedStatus).pipe(take(1)).subscribe({
      next: ({ data, pagination }) => {
        this.orders = data;
        this.page = pagination.page;
        this.totalPages = pagination.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });
  }

  onFilterChange(): void {
    this.loadOrders(1);
  }

  viewDetail(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  trackOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId, 'tracking']);
  }

  statusLabel(status: string): string {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed') return 'Đã xác nhận';
    if (s === 'processing') return 'Đang xử lý';
    if (s === 'completed') return 'Hoàn tất';
    if (s === 'cancelled') return 'Đã hủy';
    return 'Chờ xác nhận';
  }
}
