/**
 * Standard backend API response wrapper.
 * All backend endpoints return { success, message, data }.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}
