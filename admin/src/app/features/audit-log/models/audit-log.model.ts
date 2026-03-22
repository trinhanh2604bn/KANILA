export interface AuditLogEntry {
  id: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'system';
  user: string;
  target: string;
  targetType: string;
  timestamp: string;
  details?: string;
}
