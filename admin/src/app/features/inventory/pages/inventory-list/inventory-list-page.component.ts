import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { InventoryItem, StockHistoryLog, AdjustmentReason } from '../../models/inventory.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-inventory-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-list-page.component.html',
  styleUrl: './inventory-list-page.component.css'
})
export class InventoryListPageComponent implements OnInit {
  private readonly api = inject(InventoryApiService);
  private readonly toast = inject(ToastService);

  inventory = signal<InventoryItem[]>([]);
  loading = signal(true);
  searchQuery = signal('');

  // Stock Adjustment Modal State
  isAdjusting = signal<string | null>(null);
  adjustDelta = signal<number>(0);
  adjustReason = signal<AdjustmentReason>('restock');
  adjustNotes = signal<string>('');
  isSaving = signal(false);

  // History Drawer State
  historyOpen = signal<string | null>(null);
  historyLogs = signal<StockHistoryLog[]>([]);
  historyLoading = signal(false);

  filteredInventory = computed(() => {
    let list = this.inventory();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(i => 
        i.sku.toLowerCase().includes(q) || 
        i.productName.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.api.getAll().subscribe(data => {
      this.inventory.set(data);
      this.loading.set(false);
    });
  }

  // --- Adjustment Actions ---

  openAdjustment(item: InventoryItem, delta: number) {
    this.isAdjusting.set(item.id);
    this.adjustDelta.set(delta);
    this.adjustReason.set(delta > 0 ? 'restock' : 'damage');
    this.adjustNotes.set('');
  }

  closeAdjustment() {
    this.isAdjusting.set(null);
  }

  confirmAdjustment(itemId: string) {
    this.isSaving.set(true);
    const item = this.inventory().find(i => i.id === itemId);
    const originalStock = item?.stockQuantity || 0;

    this.api.adjustStock(itemId, {
      delta: this.adjustDelta(),
      reason: this.adjustReason(),
      notes: this.adjustNotes()
    }).subscribe({
      next: (res) => {
        this.inventory.update(current => 
          current.map(i => i.id === res.item.id ? res.item : i)
        );
        this.isSaving.set(false);
        this.closeAdjustment();
        
        const actionLabel = this.adjustDelta() > 0 ? 'Added' : 'Removed';
        const qty = Math.abs(this.adjustDelta());
        this.toast.success(`${actionLabel} ${qty} units for SKU ${res.item.sku}`, 'Stock Updated', () => {
          // Undo support
          this.toast.info('Reversing stock adjustment...');
          this.api.adjustStock(itemId, { delta: -this.adjustDelta(), reason: 'manual', notes: 'Undo previous adjustment' })
            .subscribe(reverted => {
              this.inventory.update(current => current.map(i => i.id === reverted.item.id ? reverted.item : i));
              this.toast.success('Stock adjustment reversed.');
            });
        });
      },
      error: () => {
        this.toast.error('Failed to adjust stock');
        this.isSaving.set(false);
      }
    });
  }

  // --- History Log ---

  toggleHistory(itemId: string) {
    if (this.historyOpen() === itemId) {
      this.historyOpen.set(null);
      return;
    }
    
    this.historyOpen.set(itemId);
    this.historyLoading.set(true);
    this.api.getHistory(itemId).subscribe(logs => {
      this.historyLogs.set(logs);
      this.historyLoading.set(false);
    });
  }
}
