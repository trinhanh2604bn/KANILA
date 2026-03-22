export interface Review {
  id: string;
  productId: string;
  productName: string;
  /** Short headline from the customer (maps to reviewTitle). */
  title?: string;
  customerName: string;
  rating: number; // 1 to 5
  /** Main review body (maps to reviewContent). */
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  images?: string[];
  createdAt: string;
}
