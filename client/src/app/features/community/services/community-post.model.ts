/** Mô hình bài viết feed Community — dùng chung communityhome + profile */

export type PostType = 'look' | 'review' | 'swatch' | 'question' | 'tip' | 'poll';

export interface ProductTag {
  name: string;
  brand: string;
  price: string;
}

export interface CommunityAuthor {
  id: string;
  name: string;
  avatar: string;
  following: boolean;
}

export interface CommunityPostItem {
  id: string;
  type: PostType;
  title: string;
  caption: string;
  image: string;
  images: string[];
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  author: CommunityAuthor;
  chips: string[];
  tags: ProductTag[];
  timestamp: string;
  createdAt: number;
}

/** ID tác giả khi user đăng từ communityhome */
export const COMMUNITY_CURRENT_USER_ID = 'u-current';
