import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryApiService } from '../../services/inventory-api.service';
import { InventoryItem, StockHistoryLog, AdjustmentReason } from '../../models/inventory.model';
import { ToastService } from '../../../../core/services/toast.service';
import { forkJoin, map } from 'rxjs';

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
  productImages = signal<Record<string, string>>({});
  private readonly loadedProductImageIds = new Set<string>();

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

  groupedInventory = computed(() => {
    const list = this.filteredInventory();
    const groups = new Map<string, InventoryItem[]>();
    const productIdByKey = new Map<string, string>();

    for (const item of list) {
      const full = (item.productName || '').trim();
      const parts = full.split(' - ').map((p) => p.trim()).filter(Boolean);
      const productKey = parts[0] || full || item.sku || 'Unnamed product';

      const existing = groups.get(productKey) ?? [];
      existing.push(item);
      groups.set(productKey, existing);
      if (!productIdByKey.has(productKey) && item.productId) {
        productIdByKey.set(productKey, item.productId);
      }
    }

    return Array.from(groups.entries())
      .map(([productKey, variants]) => ({
        productKey,
        productId: productIdByKey.get(productKey) || variants[0]?.productId || '',
        variants: variants.sort((a, b) => a.sku.localeCompare(b.sku)),
      }))
      .sort((a, b) => a.productKey.localeCompare(b.productKey));
  });

  variantLabel(item: InventoryItem): string {
    const full = (item.productName || '').trim();
    if (!full) return item.sku || 'Variant';
    const parts = full.split(' - ').map((p) => p.trim());
    if (parts.length <= 1) return full;
    const rest = parts.slice(1).filter(Boolean);
    return rest.join(' - ') || full;
  }

  ngOnInit() {
    this.api.getAll().subscribe(data => {
      this.inventory.set(data);
      this.loading.set(false);
      this.loadProductImages(data);
    });
  }

  private loadProductImages(list: InventoryItem[]) {
    const ids = Array.from(new Set(list.map(i => i.productId).filter(Boolean)));
    const toFetch = ids.filter(id => !this.loadedProductImageIds.has(id));
    if (toFetch.length === 0) return;

    forkJoin(
      toFetch.map(id =>
        this.api.getPrimaryProductImage(id).pipe(
          map(url => ({ id, url }))
        )
      )
    ).subscribe(results => {
      const current = { ...this.productImages() };
      for (const r of results) {
        if (r.url) current[r.id] = r.url;
        this.loadedProductImageIds.add(r.id);
      }
      this.productImages.set(current);
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

  confirmAdjustment(item: InventoryItem) {
    this.isSaving.set(true);
    const currentItem = this.inventory().find(i => i.id === item.id) || item;

    this.api.adjustStock(currentItem, {
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
          this.api.adjustStock(res.item, {
            delta: -this.adjustDelta(),
            reason: 'manual',
            notes: 'Undo previous adjustment',
          }).subscribe(reverted => {
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

  toggleHistory(item: InventoryItem) {
    const itemId = item.id;
    if (this.historyOpen() === itemId) {
      this.historyOpen.set(null);
      return;
    }
    
    this.historyOpen.set(itemId);
    this.historyLoading.set(true);
    this.api.getHistory(item.variantId, item.warehouseId).subscribe(logs => {
      this.historyLogs.set(logs);
      this.historyLoading.set(false);
    });
  }
}
