/**
 * Single source of truth for TRENDING GALLERY (community home + gallery pages).
 * Update titles, excerpts, images, and body here to keep both screens in sync.
 */
export interface TrendingGalleryArticle {
  id: string;
  title: string;
  excerpt: string;
  /** Paragraphs for detail page (plain text; line breaks between entries) */
  body: string[];
  image: string;
  date: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
  likes: number;
  views: number;
  commentsCount: number;
  createdAt: number;
  /** Gallery grid layout */
  size: 'large' | 'small';
  layout: 'media-left' | 'media-right';
}

export const TRENDING_GALLERY_ARTICLES: TrendingGalleryArticle[] = [
  {
    id: 'tg-1',
    title: 'Unleash Your Color – Khơi Nguồn Sắc Môi Độc Bản',
    excerpt:
      'Khám phá bộ sưu tập son môi mới nhất từ Kanila – nơi những gam màu thời thượng hội tụ để tôn vinh mọi tông da, giúp bạn tự tin tỏa sáng',
    body: [
      'Mỗi cá nhân là một bản thể duy nhất với những nét đẹp riêng biệt, và màu son chính là "tuyên ngôn" rõ ràng nhất cho cá tính đó. Chiến dịch Unleash Your Color của KANILA khuyến khích bạn thử những gam màu từng e ngại — vì đôi khi chỉ một thỏi son đủ để thay đổi cả mood trong ngày.',
      'Về bộ sưu tập: chúng tôi cân chỉnh sắc độ đỏ, hồng đất và berry sao cho hài hòa với undertone ấm/lạnh phổ biến ở làn da châu Á. Kết cấu son được tối ưu để lên màu chuẩn ngay lần quẹt đầu, không bột, không lộ vân môi khô.',
      'Mẹo chọn màu: da ngăm có thể thử tông gạch đỏ hoặc mận chín; da sáng thường hợp hồng san hô hoặc MLBB. Nếu chưa chắc undertone, soi mạch tay dưới ánh sáng tự nhiên hoặc thử son trực tiếp tại cửa hàng KANILA để được tư vấn.',
      'Cách đánh cho môi căng mọng: tẩy da chết nhẹ 1–2 lần/tuần, dưỡng môi trước makeup 5 phút, viền môi bằng cọ mảnh rồi tán son từ trong ra ngoài. Có thể thêm một chút highlight dạng kem giữa môi trên để tạo hiệu ứng đầy đặn.',
      'Phối đồ & makeup: son đậm nên đi cùng mắt nhẹ và má hồng đồng bộ tông; son nhẹ thì có thể nhấn thêm chân mày và mascara để gương mặt vẫn có điểm nhìn.',
      'Cộng đồng KANILA: hãy đăng swatch và layout của bạn lên Gallery — mỗi chia sẻ đều giúp người khác tự tin hơn khi chọn màu. Unleash Your Color không phải là phải "lố", mà là dám là chính mình.',
    ],
    image: 'assets/images/community/2.png',
    date: '20/3/2025',
    tags: ['#SonMoi', '#KANILA', '#Trending', '#Makeup'],
    authorName: 'Ngọc Trâm',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
    likes: 632,
    views: 2102,
    commentsCount: 84,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    size: 'large',
    layout: 'media-left'
  },
  {
    id: 'tg-2',
    title: 'Effortless Beauty – Đẹp Rạng Rỡ Không Gắng Gượng',
    excerpt:
      'Với KANILA, vẻ đẹp hoàn hảo nằm ở sự tinh tế và bền bỉ. Khám phá bí quyết để luôn tươi tắn với lớp nền và màu môi không trôi, bất kể ngày dài bận rộn.',
    body: [
      '“Effortless beauty” là khi bạn nhìn gương và cảm thấy mình vừa đủ: không quá nặng nề nhưng vẫn chỉn chu đi làm, đi cà phê hay họp online. Bí quyết nằm ở lớp nền mỏng, sản phẩm đa năng (vừa má vừa môi) và finish tự nhiên.',
      'Buổi sáng bận rộn: sau bước toner và serum, chỉ cần kem chống nắng có nâng tông nhẹ hoặc cushion đúng undertone. Che khuyết điểm cục bộ thay vì phủ cả mặt; phấn phủ chỉ ở vùng chữ T nếu da dầu.',
      'Giữ màu môi và má bền: son tint hoặc kem má cùng tông tạo sự hài hòa; tránh quá nhiều lớp dầu trên môi trước khi đánh son bóng. Mang theo giấy thấm dầu và một thỏi son dưỡng có màu để touch-up nhanh giữa trưa.',
      'Môi trường máy lạnh làm da mất nước — xịt khoáng cách vài giờ giúp lớp nền bớt cakey. Cuối ngày, tẩy trang kỹ và dưỡng ẩm lại để ngày hôm sau makeup vẫn mịn.',
      'Tinh thần Effortless của KANILA: đẹp không phải là hoàn hảo từng milimet, mà là cảm giác thoải mái với chính gương mặt mình. Hãy chọn 3 sản phẩm “chân ái” và xoay vòng thay vì chồng chất quá nhiều bước.',
    ],
    image: 'assets/images/community/3.png',
    date: '7/10/2025',
    tags: ['#Effortless', '#Base', '#Longwear', '#KANILA'],
    authorName: 'Bảo Nghi',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    likes: 713,
    views: 2881,
    commentsCount: 119,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    size: 'large',
    layout: 'media-right'
  },
  {
    id: 'tg-3',
    title: 'Professional Beauty: Đẹp Toàn Diện Từ Tóc Đến Da',
    excerpt:
      'Khám phá bí quyết chăm sóc tóc chuyên nghiệp để sở hữu độ bóng mượt và bồng bềnh chuẩn salon ngay tại nhà.Tham gia với KANILA ngay nào',
    body: [
      'Professional beauty ở đây hiểu theo nghĩa toàn diện: tóc bóng mượt, da đầu khỏe và làn da mặt đều màu — vì ánh nhìn đầu tiên thường bao gồm cả gương mặt lẫn mái tóc.',
      'Chăm sóc tóc tại nhà: gội 2–3 lần/tuần tùy độ dầu; xả tập trung vào ngọn; 1–2 lần/tuần dùng mask hoặc dầu ủ trước khi gội để phục hồi tóc nhuộm hoặc tóc uốn. Serum khô tóc chỉ thoa ngọn để tránh bết chân tóc.',
      'Da đầu là “đất” của tóc: massage bằng đầu ngón tay khi gội kích thích tuần hoàn; tránh nước quá nóng. Nếu gàu hoặc ngứa kéo dài, nên tham khảo sản phẩm dành cho da đầu nhạy cảm hoặc bác sĩ da liễu.',
      'Làm đẹp da mặt song song: tẩy trang mỗi tối, kem chống nắng ban ngày, và exfoliate nhẹ 1 lần/tuần giúp sản phẩm dưỡng thấm tốt hơn. Gương mặt sáng sẽ cân bằng visual khi bạn đầu tư vào mái tóc.',
      'Styling an toàn: hạn chế nhiệt cao liên tục; dùng xịt bảo vệ nhiệt trước khi sấy; buộc tóc lỏng khi ngủ để giảm gãy. KANILA tin routine nhỏ nhưng đều đặn luôn thắng “hành động mạnh một lần rồi bỏ”.',
    ],
    image: 'assets/images/community/4.png',
    date: '9/12/2025',
    tags: ['#HairCare', '#Skincare', '#ProTips', '#KANILA'],
    authorName: 'Mai Anh',
    authorAvatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
    likes: 389,
    views: 1412,
    commentsCount: 52,
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    size: 'small',
    layout: 'media-left'
  },
  {
    id: 'tg-4',
    title: 'Let Your True Self Shine – Đánh Thức Vẻ Đẹp Đích Thực',
    excerpt:
      'Hãy cùng KANILA khám phá những bộ sản phẩm được thiết kế riêng biệt cho mọi tông da, giúp bạn tự tin tỏa sáng với thần thái tự nhiên nhất.',
    body: [
      'Mỗi tông da đều có “điểm sáng” riêng. KANILA giúp bạn chọn highlight, má hồng và son sao cho hài hòa – không lấn át vẻ đẹp tự nhiên của bạn. 🌟',
      'Ưu tiên lớp nền mỏng, để texture da thoáng; sau đó nhấn nhá bằng má và môi cùng họ màu ấm hoặc lạnh tùy undertone.',
      'True self shine là khi bạn cảm thấy thoải mái nhất trên chính làn da của mình. ❤️'
    ],
    image: 'assets/images/community/5.png',
    date: '30/11/2024',
    tags: ['#TrueSelf', '#Undertone', '#Glow', '#KANILA'],
    authorName: 'Hà My',
    authorAvatar: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=120&q=80',
    likes: 511,
    views: 1904,
    commentsCount: 65,
    createdAt: Date.now() - 1000 * 60 * 60 * 13,
    size: 'small',
    layout: 'media-right'
  },
  {
    id: 'tg-5',
    title: 'Clean Makeup – Vẻ Đẹp Trong Trẻo & Thuần Khiết',
    excerpt:
      'Bạn đã sẵn sàng để sở hữu lớp nền mỏng nhẹ như sương và thần thái rạng rỡ tự nhiên chưa? Cùng tham gia với KANILA ngay nào',
    body: [
      'Clean makeup (trang điểm trong trẻo) đang trở thành xu hướng bền vững: ưu tiên lớp nền mỏng như sương, màu má và môi hòa vào da thay vì “đắp” lên da. KANILA khuyến khích bạn nhìn gần gương vẫn thấy texture da — đó là dấu hiệu của độ trong và kỹ thuật tán mỏng.',
      'Routine gợi ý: kem chống nắng làm lót → skin tint hoặc cushion 1 lớp → concealer chấm mụn/quầng thâm → má kem blend bằng ngón hoặc sponge ẩm → chân mày chải và điểm chỗ thưa → mascara một lớp hoặc uốn mi.',
      'Tránh cakey: chờ kem dưỡng thấm trước khi đánh nền; phấn phủ chỉ vùng cần cố định (thường là dưới mắt và cánh mũi). Da khô có thể bỏ phấn phủ toàn mặt, chỉ xịt khoáng.',
      'Sản phẩm “clean” về mặt cảm quan: son bóng nhẹ, má dạng kem/sữa, highlighter kem tan vào da. Tránh contour quá đậm nếu mục tiêu là thuần khiết.',
      'Thuần khiết cũng là thói quen: cọ và mút định kỳ giặt, hết hạn thì thay, tẩy trang đêm để da được nghỉ. KANILA Community rất hoan nghênh bạn chia sẻ before/after clean makeup để truyền cảm hứng cho người mới bắt đầu.',
    ],
    image: 'assets/images/community/6.png',
    date: '15/1/2026',
    tags: ['#CleanBeauty', '#SkinTint', '#Natural', '#KANILA'],
    authorName: 'Khánh Linh',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    likes: 804,
    views: 3200,
    commentsCount: 143,
    createdAt: Date.now() - 1000 * 60 * 60 * 21,
    size: 'large',
    layout: 'media-left'
  },
  {
    id: 'tg-6',
    title: 'Skin Reset 7 Ngày – Luân Phiên Để Da Ổn Định',
    excerpt:
      'Một lịch routine hợp lý giúp da “thở”, giảm kích ứng và lên khỏe dần qua từng ngày. Luân phiên dưỡng – phục hồi – chống nắng đúng cách.',
    body: [
      'Skin reset là khi bạn ưu tiên phục hồi hàng rào da (barrier) trước khi “đốt cháy” bằng quá nhiều hoạt chất. Kế hoạch 7 ngày này tập trung vào sự đều đặn và cảm giác da êm hơn theo thời gian.',
      'Ngày 1–3: làm sạch dịu nhẹ, cấp nước là chính. Ưu tiên serum hydrating và kem dưỡng khóa ẩm. Tránh tẩy da chết mạnh để giảm tình trạng đỏ rát/khô căng.',
      'Ngày 4–5: có thể bổ sung exfoliate nhẹ (BHA/PHA hoặc AHA nồng độ vừa) nếu da chịu được. Luôn làm chậm lại: thoa mỏng, test vùng nhỏ trước và theo dõi phản ứng.',
      'Ngày 6: “hạ nhiệt” bằng phục hồi: phục hồi/ceramide/centella. Da cần được cho nghỉ để giảm mẩn và giảm độ sần.',
      'Ngày 7: chống nắng đầy đủ + dưỡng lại. Skin reset hiệu quả khi bạn nhìn thấy da bớt kích ứng và lớp nền lên mịn hơn dù bạn không makeup dày.'
    ],
    image: 'assets/images/community/7.jpg',
    date: '28/3/2026',
    tags: ['#SkinReset', '#Routine7Ngay', '#BarrierCare', '#SkinCycling'],
    authorName: 'Khánh Linh',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    likes: 988,
    views: 3520,
    commentsCount: 206,
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
    size: 'small',
    layout: 'media-right'
  },
  {
    id: 'tg-7',
    title: 'Before/After Nâng Tông Tự Nhiên – Đều Mà Không Căng',
    excerpt:
      'Nâng tông không nhất thiết phải phủ dày. Bí quyết nằm ở việc chọn nền đúng undertone và kỹ thuật layer mỏng để da trông “thật” hơn.',
    body: [
      'Before/After đẹp là khi bạn nhìn gần vẫn thấy da có texture tự nhiên, không bị mảng hay xuống màu. KANILA gợi ý bạn tập trung vào undertone và độ mịn của lớp nền hơn là độ “trắng”.',
      'Bước nền chuẩn: dưỡng ẩm đủ, dùng primer mỏng nếu cần kiểm soát dầu, sau đó thoa skin tint/cushion theo lớp mỏng. Che khuyết điểm theo điểm, không phủ full toàn mặt.',
      'Chọn màu: test trên viền hàm dưới ánh sáng tự nhiên giúp bạn thấy undertone rõ nhất. Nếu bạn thấy “xám” hoặc “hồng quá”, hãy chỉnh sang tông trung tính hơn.',
      'Để tông ổn định suốt ngày: dùng xịt khoáng nhẹ trong khoảng giữa buổi, và phấn phủ chỉ vùng cần cố định (thường là T-zone).',
      'Mẹo chụp before/after: cùng ánh sáng, cùng góc chụp, và ghi rõ sản phẩm/giờ makeup để người xem dễ hiểu bạn đã thay đổi bằng cách nào.'
    ],
    image: 'assets/images/community/10.jpg',
    date: '12/2/2026',
    tags: ['#BeforeAfter', '#NangTong', '#BaseMakeup', '#KANILA'],
    authorName: 'Bảo Nghi',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    likes: 1210,
    views: 4010,
    commentsCount: 268,
    createdAt: Date.now() - 1000 * 60 * 60 * 80,
    size: 'large',
    layout: 'media-left'
  },
  {
    id: 'tg-8',
    title: 'Routine Dưỡng Sáng Da Không Bết – Lên Khỏe Sau 7 Ngày',
    excerpt:
      'Routine nhẹ mà đều, giúp da căng ẩm và nhìn “sáng” hơn mà không bị bí. Theo lịch 7 ngày và kết quả bạn sẽ thấy rõ trong lớp nền.',
    body: [
      'Routine sáng da không có nghĩa là “càng nhiều càng tốt”. KANILA nhấn mạnh vào mức độ dễ chịu cho da: dưỡng đủ ẩm, giảm kích ứng, tăng độ đều màu theo tuần.',
      'Ngày 1–2: làm sạch và cấp nước. Serum dạng lỏng/gel phù hợp da thích thở. Nếu da dễ nhạy, ưu tiên thành phần phục hồi và tránh hoạt chất quá mạnh.',
      'Ngày 3–4: thêm bước nuôi dưỡng nhẹ: lotion dưỡng sáng hoặc kem dưỡng có chứa niacinamide/peptide nồng độ phù hợp. Layer mỏng để da không bết.',
      'Ngày 5–6: kết hợp chống nắng tốt (đây là bước quyết định). Bạn sẽ thấy da “vui” hơn khi nền không bị xỉn màu và không bị loang sau vài giờ.',
      'Ngày 7: dưỡng kết thúc bằng khóa ẩm. Chụp lại lớp nền hoặc selfie dưới ánh sáng tương tự để bạn tự thấy sự khác biệt rõ ràng.'
    ],
    image: 'assets/images/community/11.jpg',
    date: '3/3/2026',
    tags: ['#DưỡngSáng', '#7Ngay', '#KhôngBết', '#Skincare'],
    authorName: 'Mai Anh',
    authorAvatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
    likes: 846,
    views: 3180,
    commentsCount: 154,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    size: 'small',
    layout: 'media-right'
  },
  {
    id: 'tg-9',
    title: 'MLBB Mùa Hè – Swatch & Outfit Dễ Hợp Mọi Buổi',
    excerpt:
      'MLBB hợp là khi bạn nhìn “người thật việc thật” và gương mặt vẫn có thần thái. Swatch đúng ánh sáng + cách layering sẽ giúp son bền và đẹp hơn.',
    body: [
      'MLBB không phải là một màu duy nhất, mà là “độ hòa hợp” giữa undertone và sắc độ môi. Mùa hè, ưu tiên chất son nhẹ, không quá khô và lên màu nhanh.',
      'Swatch chuẩn: chấm 3 tông gần nhau trên cùng khu vực môi/viền môi và chụp dưới ánh sáng tự nhiên. Bạn sẽ thấy màu hợp nhất khi đặt cạnh da thật.',
      'Cách layering: tán một lớp thật mỏng trước để kiểm soát độ đậm, sau đó thêm một lớp ở giữa môi (center focus) nếu muốn hiệu ứng căng mọng.',
      'Outfit gợi ý: MLBB hợp với áo trắng, be, pastel; makeup mắt nhẹ (mascara/liner mảnh) và má hồng đồng tông sẽ giúp cả set nhìn “có ý đồ”.',
      'Cộng đồng KANILA: chia sẻ swatch của bạn lên Gallery. Mỗi bài là một gợi ý để người khác chọn đúng màu mà không phải thử quá nhiều.'
    ],
    image: 'assets/images/community/12.jpg',
    date: '1/4/2026',
    tags: ['#MLBB', '#Swatch', '#MuaHe', '#Makeup'],
    authorName: 'Hà My',
    authorAvatar: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=120&q=80',
    likes: 1320,
    views: 4680,
    commentsCount: 302,
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    size: 'large',
    layout: 'media-left'
  }
];

export function getTrendingArticleById(id: string): TrendingGalleryArticle | undefined {
  return TRENDING_GALLERY_ARTICLES.find((a) => a.id === id);
}
