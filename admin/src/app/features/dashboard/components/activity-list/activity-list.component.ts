import { Component, input } from '@angular/core';

export interface ActivityItem {
  icon: string;
  title: string;
  time: string;
  status: string;
  statusType: 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

@Component({
  selector: 'app-activity-list',
  standalone: true,
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.css',
})
export class ActivityListComponent {
  activities = input<ActivityItem[]>([]);
}
