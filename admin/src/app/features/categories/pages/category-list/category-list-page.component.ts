import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoriesApiService } from '../../services/categories-api.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category-list-page.component.html',
  styleUrl: './category-list-page.component.css',
})
export class CategoryListPageComponent implements OnInit {
  private readonly api = inject(CategoriesApiService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  
  // Expanded state for tree
  expandedIds = signal<Set<string>>(new Set());

  // Flattened tree for display
  displayList = computed(() => {
    const list = this.categories();
    const roots = list.filter(c => !c.parentCategoryId);
    const result: Category[] = [];

    const flatten = (nodes: Category[], level: number) => {
      nodes.sort((a,b) => a.displayOrder - b.displayOrder).forEach(node => {
        const isExpanded = this.expandedIds().has(node.id);
        const children = list.filter(c => c.parentCategoryId === node.id);
        
        result.push({ ...node, level, expanded: isExpanded });
        
        if (isExpanded && children.length > 0) {
          flatten(children, level + 1);
        }
      });
    };

    flatten(roots, 0);
    return result;
  });

  ngOnInit(): void {
    this.api.getAll().subscribe((cats) => {
      this.categories.set(cats);
      this.loading.set(false);
    });
  }

  toggleExpand(id: string, event?: Event): void {
    event?.stopPropagation();
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  hasChildren(id: string): boolean {
    return this.categories().some((c) => c.parentCategoryId === id);
  }

  onParentRowActivate(cat: Category, event: Event): void {
    if (!this.hasChildren(cat.id)) return;
    this.toggleExpand(cat.id);
  }

  onNameKeydown(cat: Category, event: KeyboardEvent): void {
    if (!this.hasChildren(cat.id)) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleExpand(cat.id);
    }
  }

  childCount(id: string): number {
    return this.categories().filter((c) => c.parentCategoryId === id).length;
  }
}
