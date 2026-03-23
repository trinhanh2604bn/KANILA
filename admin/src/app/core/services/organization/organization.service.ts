import { Injectable, signal } from '@angular/core';
import { Organization } from '../../models/organization.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private orgs: Organization[] = [
    { id: 'org-1', name: 'KANILA Beauty', slug: 'kanila', plan: 'enterprise', memberCount: 12 },
    { id: 'org-2', name: 'Glow Cosmetics', slug: 'glow', plan: 'pro', memberCount: 5 },
    { id: 'org-3', name: 'SkinLab Demo', slug: 'skinlab', plan: 'free', memberCount: 2 },
  ];

  organizations = signal<Organization[]>(this.orgs);
  current = signal<Organization>(this.orgs[0]);
  switching = signal(false);

  switchOrg(org: Organization) {
    if (org.id === this.current().id) return;
    this.switching.set(true);
    // Simulate network delay for context switch
    setTimeout(() => {
      this.current.set(org);
      this.switching.set(false);
    }, 600);
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}
