import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css'
})
export class SettingsPageComponent {
  activeTab = signal<'general' | 'notifications' | 'preferences'>('general');
  saving = signal(false);
  saved = signal(false);
  isDirty = signal(false);

  tabs = [
    { id: 'general' as const, label: 'General', icon: 'settings' },
    { id: 'notifications' as const, label: 'Notifications', icon: 'notifications' },
    { id: 'preferences' as const, label: 'Preferences', icon: 'tune' }
  ];

  // Form models
  storeName = signal('KANILA Beauty');
  storeEmail = signal('admin@kanila.com');
  storeCurrency = signal('USD');
  storeTimezone = signal('Asia/Ho_Chi_Minh');

  emailOrderUpdates = signal(true);
  emailLowStock = signal(true);
  emailPaymentAlerts = signal(false);
  pushEnabled = signal(true);

  darkMode = signal(false);
  compactTables = signal(false);
  language = signal('en');

  switchTab(tab: 'general' | 'notifications' | 'preferences') {
    if (this.isDirty()) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    this.activeTab.set(tab);
    this.isDirty.set(false);
    this.saved.set(false);
  }

  markDirty() {
    this.isDirty.set(true);
    this.saved.set(false);
  }

  save() {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
      this.isDirty.set(false);
      setTimeout(() => this.saved.set(false), 3000);
    }, 800);
  }
}
