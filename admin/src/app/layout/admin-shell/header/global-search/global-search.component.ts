import { Component, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { SearchApiService } from '../../../../core/services/search/search-api.service';
import { SearchItem } from '../../../../core/models/search-item.model';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.css'
})
export class GlobalSearchComponent implements OnInit {
  private api = inject(SearchApiService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isFocused = signal(false);
  isLoading = signal(false);
  query = signal('');
  results = signal<SearchItem[]>([]);
  selectedIndex = signal(-1);

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap(q => this.api.search(q))
    ).subscribe({
      next: (data) => {
        // Sort effectively to group by Type organically
        const sorted = data.sort((a, b) => a.type.localeCompare(b.type));
        this.results.set(sorted);
        this.isLoading.set(false);
        this.selectedIndex.set(-1);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch(val: string) {
    this.query.set(val);
    if (!val || val.trim().length < 2) {
      this.results.set([]);
      this.isLoading.set(false);
      return;
    }
    this.searchSubject.next(val.trim());
  }

  clearSearch() {
    this.query.set('');
    this.results.set([]);
    this.searchInput?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Global hotkey to focus search bar
    if (!this.isFocused() && event.key === '/') {
       // Only if not typing in other inputs
       if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          event.preventDefault();
          this.searchInput?.nativeElement.focus();
       }
       return;
    }

    if (!this.isFocused()) return;

    const list = this.results();
    const maxIdx = list.length - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => i < maxIdx ? i + 1 : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => i > 0 ? i - 1 : maxIdx);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedIndex() !== -1 && list[this.selectedIndex()]) {
        this.selectResult(list[this.selectedIndex()]);
      }
    } else if (event.key === 'Escape') {
      this.closeSearch();
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeSearch();
    }
  }

  selectResult(item: SearchItem) {
    this.router.navigate(item.route);
    this.closeSearch();
    this.query.set('');
  }

  closeSearch() {
    this.isFocused.set(false);
    this.selectedIndex.set(-1);
    this.searchInput?.nativeElement.blur();
  }
}
