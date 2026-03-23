import { Component, input, output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MENU_CONFIG, MenuGroup } from '../../../core/config/menu.config';
import { OrgSwitcherComponent } from './org-switcher/org-switcher.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, OrgSwitcherComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  collapsed = input(false);
  toggleCollapse = output<void>();

  private readonly router = inject(Router);
  menuGroups: MenuGroup[] = MENU_CONFIG;

  isGroupActive(group: MenuGroup): boolean {
    const currentUrl = this.router.url;
    return group.items.some((item) => currentUrl.startsWith(item.route));
  }
}
