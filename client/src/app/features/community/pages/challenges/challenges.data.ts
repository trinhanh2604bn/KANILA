export interface ChallengeParticipantPost {
  id: string;
  challengeId?: string;
  challengeName?: string;
  userName: string;
  avatar: string;
  caption: string;
  image: string;
  media?: string[];
  mediaVideoFlags?: boolean[];
  likes: number;
  createdAt?: number;
}

export interface ChallengeDefinition {
  id: string;
  title: string;
  subtitle: string;
  hashtag: string;
  thumbnail: string;
  coverImage: string;
  description: string;
  rules: string;
  rewardsSummary: string;
  rewardsDetail: string;
  scoring: string;
  participants: number;
  entries: number;
  likes: number;
  rewardValueVnd: number;
  endDateIso: string;
  createdAt: number;
  popularBadge?: boolean;
  hot?: boolean;
  badge?: string;
  posts: ChallengeParticipantPost[];
}

export const CHALLENGE_SUBMIT_SUCCESS_MESSAGE = 'Đăng bài thành công! Bài của bạn đã được gửi vào challenge.';

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'c1',
    title: 'Glass Skin Glow',
    subtitle: 'Routine trong veo cho làn da căng bóng',
    hashtag: '#GlassSkinByKanila',
    thumbnail: 'assets/images/community/10.jpg',
    coverImage: 'assets/images/community/10.jpg',
    description: 'Chia sẻ routine và thành quả da căng bóng tự nhiên với sản phẩm bạn yêu thích.',
    rules: '- Đăng ảnh/video before-after\n- Viết caption tối thiểu 20 ký tự\n- Gắn hashtag challenge trong bài',
    rewardsSummary: 'Voucher 500.000đ',
    rewardsDetail: 'Top 3 bài có chất lượng nội dung tốt nhất nhận voucher 500.000đ và quà KANILA.',
    scoring: '40% chất lượng nội dung, 40% tương tác, 20% sáng tạo.',
    participants: 624,
    entries: 182,
    likes: 2480,
    rewardValueVnd: 500000,
    endDateIso: '2026-05-30',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    popularBadge: true,
    hot: true,
    badge: 'Hot',
    posts: [],
  },
  {
    id: 'c2',
    title: 'Daily Makeup 5 Minutes',
    subtitle: 'Layout đi học đi làm nhanh gọn',
    hashtag: '#5PhutDepMoiNgay',
    thumbnail: 'assets/images/community/11.jpg',
    coverImage: 'assets/images/community/11.jpg',
    description: 'Thể hiện layout makeup nhanh trong 5 phút mà vẫn xinh tươi cả ngày.',
    rules: '- Upload tối đa 5 ảnh/video\n- Mô tả các bước chính\n- Không dùng filter che phủ quá mức',
    rewardsSummary: 'Set quà trị giá 350.000đ',
    rewardsDetail: '10 bài nổi bật nhận set quà makeup mini và xuất hiện ở mục Community nổi bật.',
    scoring: '50% tính thực tế, 30% chất lượng hình ảnh, 20% tương tác.',
    participants: 418,
    entries: 133,
    likes: 1794,
    rewardValueVnd: 350000,
    endDateIso: '2026-06-10',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    popularBadge: true,
    posts: [],
  },
  {
    id: 'c3',
    title: 'Lip Combo Of The Day',
    subtitle: 'Mix son để tạo màu môi signature của bạn',
    hashtag: '#KanilaLipCombo',
    thumbnail: 'assets/images/community/12.jpg',
    coverImage: 'assets/images/community/12.jpg',
    description: 'Khoe cách phối son và tips giữ màu lâu trôi cho ngày dài.',
    rules: '- Chia sẻ công thức màu son\n- Có ít nhất 1 ảnh cận môi rõ màu\n- Caption có hashtag challenge',
    rewardsSummary: 'Voucher 250.000đ',
    rewardsDetail: '5 combo sáng tạo nhất nhận voucher 250.000đ và feature trên gallery.',
    scoring: '35% sáng tạo màu, 35% ứng dụng thực tế, 30% tương tác.',
    participants: 287,
    entries: 96,
    likes: 1210,
    rewardValueVnd: 250000,
    endDateIso: '2026-06-25',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    posts: [],
  },
  {
    id: 'c4',
    title: 'Clean Beauty Week',
    subtitle: 'Một tuần makeup nhẹ và chăm da đều đặn',
    hashtag: '#CleanBeautyKanila',
    thumbnail: 'assets/images/community/7.jpg',
    coverImage: 'assets/images/community/7.jpg',
    description: 'Document hành trình một tuần sống tối giản trong skincare và makeup.',
    rules: '- Mỗi bài có tối đa 5 media\n- Chia sẻ trải nghiệm thật\n- Nội dung lịch sự, tích cực',
    rewardsSummary: 'Quà chăm da 400.000đ',
    rewardsDetail: 'Top bài viết truyền cảm hứng nhận bộ chăm da và coupon mua sắm.',
    scoring: '40% hành trình rõ ràng, 30% ảnh/video, 30% tương tác.',
    participants: 196,
    entries: 74,
    likes: 880,
    rewardValueVnd: 400000,
    endDateIso: '2026-07-05',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    posts: [],
  },
];

export const getChallengeById = (id: string): ChallengeDefinition | undefined =>
  CHALLENGES.find((c) => c.id === id);

export const isVideoMediaUrl = (url: string): boolean => {
  const u = String(url || '').toLowerCase();
  return (
    u.startsWith('blob:video') ||
    u.startsWith('data:video') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/.test(u)
  );
};

export const getPostDisplayMedia = (post: ChallengeParticipantPost): string[] => {
  const media = post.media?.filter(Boolean) ?? [];
  if (media.length) return media;
  if (post.image) return [post.image];
  return [];
};

export const formatChallengeDeadlineVi = (iso: string): string => {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return `Đến hết ngày ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};
