/** Nguồn dữ liệu duy nhất cho CHALLENGES (community home + trang Challenges + detail/join). */

/** Thông báo sau khi đăng bài tham gia challenge (join → detail). */
export const CHALLENGE_SUBMIT_SUCCESS_MESSAGE = 'Đăng bài tham gia challenge thành công';

export interface ChallengeParticipantPost {
  id: string;
  /** Gắn với challenge khi đăng từ join — dùng để lọc đúng bài trên từng trang chi tiết */
  challengeId?: string;
  /** Tên challenge (hiển thị / kiểm tra dữ liệu; bài mẫu trong data có thể bỏ qua) */
  challengeName?: string;
  userName: string;
  avatar: string;
  caption: string;
  /** Ảnh đại diện (ưu tiên hiển thị card / fallback) */
  image: string;
  /** Nhiều ảnh/video (data URL hoặc path); nếu thiếu thì dùng `image` */
  media?: string[];
  /** Song song `media` — phân biệt blob/data URL là video (detail dùng để chọn thẻ video/img) */
  mediaVideoFlags?: boolean[];
  likes: number;
  createdAt?: number;
}

export function getPostDisplayMedia(post: ChallengeParticipantPost): string[] {
  if (post.media?.length) return post.media;
  return post.image ? [post.image] : [];
}

export function isVideoMediaUrl(url: string): boolean {
  return /^data:video\//i.test(url);
}

export type ChallengeBadgeLabel = 'Trending' | 'Hot' | 'Mới';

export interface ChallengeDefinition {
  id: string;
  title: string;
  /** Mô tả ngắn trên thẻ */
  subtitle: string;
  /** Giới thiệu / mô tả đầy đủ */
  description: string;
  /** Cách thức tham gia */
  rules: string;
  hashtag: string;
  /** Phần thưởng (tóm tắt hiển thị thẻ) */
  rewardsSummary: string;
  /** Phần thưởng người chiến thắng (chi tiết) */
  rewardsDetail: string;
  /** Cách tính điểm */
  scoring: string;
  endDateIso: string;
  coverImage: string;
  thumbnail: string;
  entries: number;
  likes: number;
  participants: number;
  badge: ChallengeBadgeLabel;
  rewardValueVnd: number;
  hot?: boolean;
  popularBadge?: boolean;
  createdAt: number;
  posts: ChallengeParticipantPost[];
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'c1',
    title: 'Makeup Look - Blush Glow',
    subtitle: 'Tạo layout má hồng glow cho các buổi tiệc cùng KANILA',
    description:
      'KANILA mời bạn thể hiện layout má hồng glow: từ kem đến bột, blend mềm và bắt sáng nhẹ để gương mặt tươi rạng dưới ánh đèn tiệc. Blush glow không chỉ là “đánh má hồng” — đó là cách bạn dẫn ánh nhìn vào phần má căng bóng, hài hòa với highlight và khối nhẹ để tổng thể trông khỏe khoắn chứ không bệch. Bạn có thể chơi tông đào, hồng san hô hay berry tùy undertone; điểm mấu chốt là độ trong và lớp tán mỏng, tránh vệt cứng. Hãy chia sẻ bí quyết chọn màu theo tông da, cách fix lớp má để giữ glow suốt buổi, và outfit hoặc phụ kiện làm nổi bật layout — mỗi chia sẻ đều giúp cộng đồng tự tin hơn khi makeup dự tiệc.',
    rules:
      '1) Đăng tối thiểu 2 ảnh: close-up má và full face.\n2) Ghi rõ sản phẩm (tên + tone) trong caption hoặc comment.\n3) Hashtag bắt buộc trong bài.\n4) Nội dung gốc, không vi phạm bản quyền.',
    hashtag: '#KANILABlushGlow',
    rewardsSummary: 'Voucher 500K',
    rewardsDetail:
      'Top 3 bài có điểm cao nhất: voucher 500.000₫ + quà surprise từ KANILA. Top 4–10: voucher 200.000₫.',
    scoring:
      'Điểm = lượt thích (40%) + lượt bình luận chất lượng (20%) + đánh giá ban giám khảo KANILA (40%). Trùng điểm ưu tiên bài đăng sớm hơn.',
    endDateIso: '2026-03-31',
    coverImage: 'assets/images/community/7.jpg',
    thumbnail: 'assets/images/community/7.jpg',
    entries: 284,
    likes: 1490,
    participants: 432,
    badge: 'Trending',
    rewardValueVnd: 500_000,
    popularBadge: true,
    createdAt: Date.now() - 86400000 * 2,
    posts: [
      {
        id: 'c1-p1',
        userName: 'Minh Anh',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        caption: 'Glow hồng đào + highlight nhẹ — son MLBB để cân bằng.',
        image: 'assets/images/community/3.png',
        likes: 312
      },
      {
        id: 'c1-p2',
        userName: 'Lan Chi',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        caption: 'Blush dạng kem tán bằng sponge, giữ da căng mướt cả tối.',
        image: 'assets/images/community/5.png',
        likes: 198
      }
    ]
  },
  {
    id: 'c2',
    title: 'Skincare Routine Challenge',
    subtitle: 'Chia sẻ routine dưỡng sáng da 7 ngày cùng before/after.',
    description:
      'Thử thách 7 ngày chăm sóc da có chứng minh before/after. Ưu tiên routine phù hợp da dầu/khô/nhạy cảm, có bước chống nắng ban ngày. KANILA tin rằng làn da “đẹp dần” đến từ sự đều đặn hơn là một sản phẩm thần kỳ: trong một tuần, bạn có thể tập trung làm dịu, cấp ẩm hoặc kiểm soát dầu — miễn là mục tiêu rõ và thành phần không xung đột nhau. Hãy ghi nhật ký ngắn (cảm giác da sáng/ngứa/bóng nhờn vào buổi trưa, v.v.) để mọi người học được cách đọc tín hiệu da. Nếu bạn đang phục hồi sau mụn hay peel, hãy nêu rõ hạn chế và bước an toàn; cộng đồng luôn cổ vũ routine trung thực, nhẹ nhàng và bền vững.',
    rules:
      '1) Ảnh before/after rõ nét, cùng góc chụp.\n2) Liệt kê sản phẩm đã dùng (sáng/tối).\n3) Giữ hashtag challenge trong caption.\n4) Không chỉnh sửa quá mức ảnh so sánh.',
    hashtag: '#KANILASkincare7',
    rewardsSummary: 'Combo skincare',
    rewardsDetail: '3 giải nhất: combo dưỡng KANILA (tẩy trang + serum + kem dưỡng). 10 giải khuyến khích: voucher 150.000₫.',
    scoring: '70% chất lượng nội dung & nhất quán 7 ngày, 30% tương tác cộng đồng.',
    endDateIso: '2026-05-31',
    coverImage: 'assets/images/community/11.jpg',
    thumbnail: 'assets/images/community/11.jpg',
    entries: 193,
    likes: 1012,
    participants: 309,
    badge: 'Hot',
    rewardValueVnd: 650_000,
    hot: true,
    createdAt: Date.now() - 86400000 * 5,
    posts: [
      {
        id: 'c2-p1',
        userName: 'Thu Hà',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
        caption: 'Tuần 1: tập trung barrier — sáng chỉ vitamin C nhẹ, tối retinol alternate.',
        image: 'assets/images/community/11.jpg',
        likes: 421
      },
      {
        id: 'c2-p2',
        userName: 'Quỳnh Mai',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
        caption: 'Da dầu: BHA 2x/tuần + gel dưỡng không dầu khoá ẩm.',
        image: 'assets/images/community/2.png',
        likes: 267
      }
    ]
  },
  {
    id: 'c3',
    title: 'Son MLBB Mùa Hè',
    subtitle: 'Đăng swatch tone son MLBB yêu thích và outfit phù hợp.',
    description:
      'Mùa hè cần son bền màu và MLBB “tự nhiên như môi thật”. Hãy swatch, soi undertone và gợi ý phối đồ trong cùng một bài. MLBB (My Lips But Better) là lựa chọn an toàn khi trời nóng, da dễ đỏ, hay khi bạn muốn để nhấn vào mắt/má. Thử thách khuyến khích bạn thử son dạng kem, tint hay bóng — mỗi finish sẽ cho cảm giác và độ bền khác nhau trên môi mỏng/dày. Bạn có thể kể thêm tip: lót môi, kẻ viền mờ, hay cách touch-up sau ăn uống. Phần outfit gợi ý giúp người xem hình dung tổng thể tông makeup; KANILA mong nhận được những swatch trung thực dưới nắng và trong nhà để mọi người so sánh được độ lệch màu.',
    rules:
      '1) Tối thiểu 1 ảnh swatch trên môi (ánh sáng tự nhiên).\n2) Ghi brand + mã màu.\n3) Caption có hashtag.\n4) Có thể thêm 1 ảnh flatlay outfit.',
    hashtag: '#KANILAMLBBsummer',
    rewardsSummary: 'Set son mini',
    rewardsDetail: 'Bộ sưu tập son mini best-seller + voucher 300.000₫ cho 5 bài được vote cao nhất.',
    scoring: 'Swatch rõ undertone + mô tả cảm nhận chất son (bám, khô môi hay không) chiếm 50% điểm chấm.',
    endDateIso: '2026-04-05',
    coverImage: 'assets/images/community/12.jpg',
    thumbnail: 'assets/images/community/12.jpg',
    entries: 128,
    likes: 876,
    participants: 215,
    badge: 'Mới',
    rewardValueVnd: 350_000,
    createdAt: Date.now() - 86400000 * 1,
    posts: [
      {
        id: 'c3-p1',
        userName: 'Hoàng Yến',
        avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=120&q=80',
        caption: 'MLBB hồng trầm — hợp da neutral, không lộ vân.',
        image: 'assets/images/community/12.jpg',
        likes: 189
      }
    ]
  },
  {
    id: 'c4',
    title: 'Makeup Nhanh Trong 10m',
    subtitle: 'Đăng video makeup mọi tone chỉ trong 10 phút để nhận ngay VOUCHER 50%',
    description:
      'Dành cho người bận rộn: hoàn thiện makeup trong 10 phút (có timer trên video hoặc ảnh sequence có timestamp). Đây là playground cho những ai đi làm sớm, đưa con đi học hay chỉ đơn giản không muốn dành cả buổi trước gương — nhưng vẫn muốn nhìn chỉn chu, tươi. Bạn được khuyến khích tối ưu từng bước: nền mỏng, má-môi đồng tông, chân mày nhanh và một điểm nhấn (mi hoặc eyeliner). Hãy cho cộng đồng biết “bộ ba cứu cánh” của bạn là gì, và cách bạn sửa lỗi khi hết thời gian (ví dụ dính mascara, nền quá sáng). Mục tiêu là truyền cảm hứng: makeup nhanh vẫn có thể tinh tế, phù hợp văn phòng hoặc cafe cuối tuần.',
    rules:
      '1) Video ≤ 60s hoặc carousel 4–6 ảnh có mốc thời gian.\n2) Liệt kê sản phẩm dùng.\n3) Hashtag đúng format.\n4) Không tua nhanh quá mức gây hiểu nhầm.',
    hashtag: '#KANILA10phut',
    rewardsSummary: 'Voucher 50%',
    rewardsDetail: 'Voucher giảm 50% tối đa 300K cho 20 bài đạt điểm tối thiểu; quà limited cho top đầu.',
    scoring: 'Hoàn thành trong 10 phút (40%), tính thẩm mỹ (30%), sáng tạo (30%).',
    endDateIso: '2026-04-30',
    coverImage: 'assets/images/community/10.jpg',
    thumbnail: 'assets/images/community/10.jpg',
    entries: 128,
    likes: 876,
    participants: 215,
    badge: 'Mới',
    rewardValueVnd: 300_000,
    createdAt: Date.now() - 86400000 * 7,
    posts: [
      {
        id: 'c4-p1',
        userName: 'Bảo Trâm',
        avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=120&q=80',
        caption: '5p base + 3p má môi + 2p mascara — xong!',
        image: 'assets/images/community/10.jpg',
        likes: 341
      }
    ]
  },
  {
    id: 'c5',
    title: 'Sunscreen Everyday',
    subtitle: '60 ngày không bỏ bước chống nắng để có làn da mịn màng cùng KANILA',
    description:
      'Xây thói quen chống nắng mỗi ngày: chia sẻ texture yêu thích, cách tái apply và trải nghiệm dưới nắng gắt. Tia UV tác động lên da ngay cả khi trời âm u, nên lớp chống nắng đủ lượng và tái lập định kỳ chính là “bảo hiểm” cho nám, sạm và lão hóa sớm. KANILA muốn thấy cách bạn tích hợp SPF vào routine: kem lót có chỉ số, kem chống nắng vật lý/hóa học lai, hay xịt bổ sung trên makeup. Hãy thử thách bản thân check-in đều — mỗi lần là dịp nhắc nhở cộng đồng: chống nắng không phải mùa hè mà là hành trình cả năm. Kể những tình huống thực tế (đi bơi, chạy bộ, ngồi văn phòng sát kính) để mọi người chọn đúng sản phẩm cho cuộc sống của họ.',
    rules:
      '1) Check-in tối thiểu 3 lần/tuần (ảnh sản phẩm + tình huống).\n2) Ghi SPF/PA.\n3) Dùng hashtag challenge.\n4) Khuyến khích ảnh “reapply” ngoài trời.',
    hashtag: '#KANILASPF90',
    rewardsSummary: 'Voucher 1.000K',
    rewardsDetail: 'Giải đặc biệt: voucher 1.000.000₫ + bộ chống nắng full size. Giải nhì–ba: voucher 500.000₫.',
    scoring: 'Tính nhất quán (check-in) 45%, chất lượng hình ảnh & mô tả 35%, tương tác 20%.',
    endDateIso: '2026-03-28',
    coverImage: 'assets/images/community/6.png',
    thumbnail: 'assets/images/community/6.png',
    entries: 412,
    likes: 2234,
    participants: 518,
    badge: 'Trending',
    rewardValueVnd: 1_000_000,
    hot: true,
    popularBadge: true,
    createdAt: Date.now() - 86400000 * 3,
    posts: [
      {
        id: 'c5-p1',
        userName: 'Ngọc Anh',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
        caption: 'Gel không nhờn — makeup không trôi sau 4h.',
        image: 'assets/images/community/6.png',
        likes: 512
      },
      {
        id: 'c5-p2',
        userName: 'Đức Minh',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
        caption: 'Reapply cushion SPF50 trưa, da vẫn mịn.',
        image: 'assets/images/community/4.png',
        likes: 276
      }
    ]
  },
  {
    id: 'c6',
    title: 'Blush Placement Challenge',
    subtitle: 'Má hồng chữ C, W hay draping? — thử và chia sẻ cùng KANILA',
    description:
      'So sánh cách đánh má: chữ C cổ điển, W trẻ trung hay draping high fashion. KANILA muốn thấy khuôn mặt thật của bạn. Mỗi kỹ thuật placement thay đổi cảm giác xương gò má, độ tròn của mặt và cách ánh sáng “chạm” vào da: chữ C ôm cạnh thái dương giúp nâng góc nhìn; W nhấn phần má dưới tạo vibe tươi trẻ; draping dùng sắc đậm hơn, gần contour hơn để tạo chiều sâu nghệ thuật. Bạn không cần makeup chuyên nghiệp — chỉ cần thử ít nhất hai cách đánh khác nhau và cho mọi người thấy sự khác biệt trên cùng một góc chụp. Chia sẻ loại cọ hoặc sponge bạn dùng, cách blend ranh giới với phấn phủ, và lời khuyên cho từng shape mặt sẽ được cộng đồng đón nhận nồng nhiệt.',
    rules:
      '1) Tối thiểu 2 ảnh: trước và sau hoặc hai placement khác nhau.\n2) Giải thích vì sao chọn technique đó.\n3) Hashtag đầy đủ.\n4) Tag 1 bạn để cùng thử.',
    hashtag: '#KANILABlushPlacement',
    rewardsSummary: 'Phấn má cao cấp',
    rewardsDetail: '3 bài xuất sắc: phấn má cao cấp + brush KANILA. 7 giải khuyến khích: voucher 200K.',
    scoring: 'Độ rõ layout + phối màu hài hòa với son/mắt (50%), caption hướng dẫn (50%).',
    endDateIso: '2026-06-01',
    coverImage: 'assets/images/community/4.png',
    thumbnail: 'assets/images/community/4.png',
    entries: 156,
    likes: 445,
    participants: 156,
    badge: 'Mới',
    rewardValueVnd: 450_000,
    createdAt: Date.now() - 86400000 * 10,
    posts: [
      {
        id: 'c6-p1',
        userName: 'Phương Linh',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80',
        caption: 'Draping nhẹ — cam san hô mix hồng tím.',
        image: 'assets/images/community/4.png',
        likes: 133
      }
    ]
  }
];

export function getChallengeById(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/** Hiển thị ngày kết thúc kiểu community home: Kết thúc: dd/mm/yyyy */
export function formatChallengeDeadlineVi(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `Kết thúc: ${dd}/${mm}/${y}`;
}
