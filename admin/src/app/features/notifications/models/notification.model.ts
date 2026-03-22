export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'order' | 'payment' | 'stock' | 'system';
  icon: string;
  read: boolean;
  timestamp: string;
  route?: string[];
}
