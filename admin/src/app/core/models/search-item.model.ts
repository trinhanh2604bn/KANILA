export interface SearchItem {
  id: string;
  title: string;
  type: 'product' | 'order' | 'review' | 'customer';
  metadata: string;
  route: any[];
  icon?: string;
  imageUrl?: string;
}
