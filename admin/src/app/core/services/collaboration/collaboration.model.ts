export interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  currentPage?: string;
  lastActive: string;
}

export interface EditLock {
  itemId: string;
  itemType: string;
  userId: string;
  userName: string;
  lockedAt: string;
}
