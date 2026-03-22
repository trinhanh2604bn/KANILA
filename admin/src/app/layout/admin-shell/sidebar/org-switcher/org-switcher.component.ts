import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService } from '../../../../core/services/organization/organization.service';
import { Organization } from '../../../../core/models/organization.model';

@Component({
  selector: 'app-org-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-switcher.component.html',
  styleUrl: './org-switcher.component.css'
})
export class OrgSwitcherComponent {
  orgService = inject(OrganizationService);
  private elRef = inject(ElementRef);
  isOpen = signal(false);

  toggle() { this.isOpen.update(v => !v); }

  select(org: Organization) {
    this.orgService.switchOrg(org);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(e: Event) {
    if (!this.elRef.nativeElement.contains(e.target)) this.isOpen.set(false);
  }

  getPlanBadge(plan: string): string {
    const map: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
    return map[plan] || plan;
  }
}
