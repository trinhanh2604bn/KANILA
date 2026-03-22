export interface ActivityItem {
  id: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'comment' | 'system';
  user: string;
  userColor: string;
  target: string;
  targetType: string;
  timestamp: string;
  detail?: string;
}
