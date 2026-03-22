/**
 * KANILA — Comprehensive Realistic Data Seed Script
 * Connects directly to MongoDB Atlas and inserts production-quality sample data.
 * Run: node seed-data.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const Brand = require("./models/brand.model");
const Category = require("./models/category.model");
const Product = require("./models/product.model");
const ProductMedia = require("./models/productMedia.model");
const Account = require("./models/account.model");
const Customer = require("./models/customer.model");
const Order = require("./models/order.model");
const OrderItem = require("./models/orderItem.model");
const OrderTotal = require("./models/orderTotal.model");
const Promotion = require("./models/promotion.model");
const Coupon = require("./models/coupon.model");
const Review = require("./models/review.model");
const Shipment = require("./models/shipment.model");

const MONGO_URI = process.env.MONGO_URI;

// ─── BRANDS ───────────────────────────────────────────────
const brandsData = [
  { brandName: "L'Oréal Paris", brandCode: "LOREAL", description: "Thương hiệu mỹ phẩm hàng đầu thế giới từ Pháp, chuyên về chăm sóc da và trang điểm.", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/L%27Or%C3%A9al_logo.svg/200px-L%27Or%C3%A9al_logo.svg.png", isActive: true },
  { brandName: "Maybelline New York", brandCode: "MAYBELLINE", description: "Thương hiệu trang điểm phổ biến nhất nước Mỹ, dành cho phụ nữ hiện đại.", logoUrl: "", isActive: true },
  { brandName: "The Ordinary", brandCode: "ORDINARY", description: "Thương hiệu dược mỹ phẩm với công thức tối giản, thành phần hoạt tính cao.", logoUrl: "", isActive: true },
  { brandName: "Innisfree", brandCode: "INNISFREE", description: "Thương hiệu mỹ phẩm thiên nhiên Hàn Quốc từ đảo Jeju.", logoUrl: "", isActive: true },
  { brandName: "Laneige", brandCode: "LANEIGE", description: "Thương hiệu chăm sóc da cao cấp Hàn Quốc, nổi tiếng với công nghệ nước.", logoUrl: "", isActive: true },
  { brandName: "Bioderma", brandCode: "BIODERMA", description: "Thương hiệu dược mỹ phẩm Pháp, giải pháp sinh học cho mọi loại da.", logoUrl: "", isActive: true },
  { brandName: "Sulwhasoo", brandCode: "SULWHASOO", description: "Thương hiệu chăm sóc da Hàn Quốc siêu cao cấp với thảo dược truyền thống.", logoUrl: "", isActive: true },
  { brandName: "Klairs", brandCode: "KLAIRS", description: "Thương hiệu Hàn Quốc dành cho làn da nhạy cảm, sản phẩm thuần chay.", logoUrl: "", isActive: true },
  { brandName: "La Roche-Posay", brandCode: "LAROCHE", description: "Thương hiệu dược mỹ phẩm Pháp được bác sĩ da liễu khuyên dùng.", logoUrl: "", isActive: true },
  { brandName: "Cocoon Vietnam", brandCode: "COCOON", description: "Thương hiệu mỹ phẩm thuần chay Việt Nam, 100% không thử nghiệm trên động vật.", logoUrl: "", isActive: true },
  { brandName: "Shiseido", brandCode: "SHISEIDO", description: "Thương hiệu mỹ phẩm cao cấp Nhật Bản với lịch sử hơn 150 năm.", logoUrl: "", isActive: true },
  { brandName: "MAC Cosmetics", brandCode: "MAC", description: "Thương hiệu trang điểm chuyên nghiệp được các chuyên gia thế giới tin dùng.", logoUrl: "", isActive: true },
];

// ─── CATEGORIES ───────────────────────────────────────────
const categoriesData = [
  { categoryName: "Chăm sóc da mặt", categoryCode: "SKINCARE", description: "Các sản phẩm chăm sóc da mặt hàng ngày", displayOrder: 1, isActive: true },
  { categoryName: "Trang điểm", categoryCode: "MAKEUP", description: "Sản phẩm trang điểm cho khuôn mặt, mắt, môi", displayOrder: 2, isActive: true },
  { categoryName: "Chăm sóc tóc", categoryCode: "HAIRCARE", description: "Dầu gội, dầu xả và sản phẩm dưỡng tóc", displayOrder: 3, isActive: true },
  { categoryName: "Chăm sóc cơ thể", categoryCode: "BODYCARE", description: "Sữa tắm, dưỡng thể và khử mùi", displayOrder: 4, isActive: true },
  { categoryName: "Nước hoa", categoryCode: "PERFUME", description: "Nước hoa nam, nữ và unisex", displayOrder: 5, isActive: true },
  { categoryName: "Chống nắng", categoryCode: "SUNCARE", description: "Kem chống nắng và bảo vệ da khỏi tia UV", displayOrder: 6, isActive: true },
  { categoryName: "Serum & Tinh chất", categoryCode: "SERUM", description: "Tinh chất đặc trị cho các vấn đề về da", displayOrder: 7, isActive: true },
  { categoryName: "Mặt nạ", categoryCode: "MASK", description: "Mặt nạ giấy, mặt nạ đất sét, mặt nạ ngủ", displayOrder: 8, isActive: true },
  { categoryName: "Son môi", categoryCode: "LIPSTICK", description: "Son thỏi, son kem, son tint", displayOrder: 9, isActive: true },
  { categoryName: "Tẩy trang", categoryCode: "CLEANSER", description: "Nước tẩy trang, dầu tẩy trang, sữa rửa mặt", displayOrder: 10, isActive: true },
];

// ─── PRODUCTS ─────────────────────────────────────────────
// Will be mapped to brand/category IDs after insertion
const productsTemplate = [
  { productName: "L'Oréal Revitalift Hyaluronic Acid Serum", productCode: "LOR-SER-001", brandIdx: 0, catIdx: 6, price: 359000, stock: 150, bought: 823, averageRating: 4.6, shortDescription: "Serum cấp ẩm chuyên sâu với Hyaluronic Acid tinh khiết", longDescription: "Serum L'Oréal Revitalift với 1.5% Hyaluronic Acid tinh khiết giúp cấp ẩm tức thì, làm đầy nếp nhăn và cho làn da căng mọng suốt 24 giờ." },
  { productName: "Maybelline Fit Me Matte Foundation", productCode: "MAY-FOU-001", brandIdx: 1, catIdx: 1, price: 189000, stock: 280, bought: 1254, averageRating: 4.3, shortDescription: "Kem nền kiềm dầu phù hợp mọi tông da châu Á", longDescription: "Kem nền Maybelline Fit Me Matte + Poreless giúp kiềm dầu hiệu quả, che phủ tự nhiên và phù hợp với tông da Việt Nam." },
  { productName: "The Ordinary Niacinamide 10% + Zinc 1%", productCode: "ORD-SER-001", brandIdx: 2, catIdx: 6, price: 245000, stock: 200, bought: 2180, averageRating: 4.7, shortDescription: "Serum giảm dầu, se khít lỗ chân lông", longDescription: "Công thức nồng độ cao với Niacinamide 10% và Zinc PCA 1% giúp kiểm soát bã nhờn, giảm mụn và se khít lỗ chân lông hiệu quả." },
  { productName: "Innisfree Green Tea Seed Cream", productCode: "INN-CRM-001", brandIdx: 3, catIdx: 0, price: 420000, stock: 95, bought: 567, averageRating: 4.5, shortDescription: "Kem dưỡng ẩm trà xanh Jeju", longDescription: "Kem dưỡng ẩm chiết xuất hạt trà xanh tươi từ đảo Jeju, giúp cấp ẩm sâu và bảo vệ hàng rào ẩm tự nhiên của da." },
  { productName: "Laneige Water Sleeping Mask", productCode: "LAN-MSK-001", brandIdx: 4, catIdx: 7, price: 650000, stock: 78, bought: 1890, averageRating: 4.8, shortDescription: "Mặt nạ ngủ cấp ẩm bán chạy số 1 Hàn Quốc", longDescription: "Mặt nạ ngủ với công nghệ SLEEP-TOX™ giúp thải độc và cấp ẩm cho da suốt đêm. Kết cấu gel mỏng nhẹ, thẩm thấu nhanh." },
  { productName: "Bioderma Sensibio H2O Micellar Water", productCode: "BIO-CLN-001", brandIdx: 5, catIdx: 9, price: 395000, stock: 320, bought: 3450, averageRating: 4.9, shortDescription: "Nước tẩy trang cho da nhạy cảm số 1 tại Pháp", longDescription: "Nước tẩy trang Bioderma Sensibio H2O với công nghệ micelle tương thích sinh học, làm sạch nhẹ nhàng mà không gây kích ứng." },
  { productName: "Sulwhasoo First Care Activating Serum", productCode: "SUL-SER-001", brandIdx: 6, catIdx: 6, price: 1890000, stock: 3, bought: 234, averageRating: 4.9, shortDescription: "Tinh chất kích hoạt trẻ hóa da với nhân sâm Hàn Quốc", longDescription: "Tinh chất JAUM Activator™ đầu tiên của Sulwhasoo với chiết xuất nhân sâm Hàn Quốc cao cấp, kích hoạt 5 yếu tố tái tạo da." },
  { productName: "Klairs Supple Preparation Toner", productCode: "KLA-TON-001", brandIdx: 7, catIdx: 0, price: 310000, stock: 175, bought: 1123, averageRating: 4.6, shortDescription: "Toner dịu nhẹ cho da nhạy cảm, pH thấp", longDescription: "Toner không chứa cồn, tinh dầu với pH 5.0 giúp cân bằng da và chuẩn bị da tiếp nhận dưỡng chất tốt hơn." },
  { productName: "La Roche-Posay Anthelios SPF50+", productCode: "LRP-SUN-001", brandIdx: 8, catIdx: 5, price: 450000, stock: 220, bought: 4521, averageRating: 4.7, shortDescription: "Kem chống nắng phổ rộng cho da dầu mụn", longDescription: "Kem chống nắng với hệ lọc MEXORYL SX+XL bảo vệ toàn diện khỏi UVA/UVB. Kết cấu sữa mỏng nhẹ, không gây mụn, không bết dính." },
  { productName: "Cocoon Cà Phê Đắk Lắk Body Scrub", productCode: "COC-BOD-001", brandIdx: 9, catIdx: 3, price: 165000, stock: 310, bought: 2890, averageRating: 4.8, shortDescription: "Tẩy da chết toàn thân từ cà phê Đắk Lắk Việt Nam", longDescription: "Tẩy da chết cơ thể với hạt cà phê Robusta Đắk Lắk, kết hợp bơ cacao và vitamin E giúp da mềm mịn, sáng khỏe." },
  { productName: "Shiseido Ultimune Power Infusing Concentrate", productCode: "SHI-SER-001", brandIdx: 10, catIdx: 6, price: 2150000, stock: 25, bought: 178, averageRating: 4.8, shortDescription: "Tinh chất tăng cường miễn dịch da", longDescription: "Tinh chất với ImuGeneration Technology™ tăng cường hệ miễn dịch da, giúp da chống lại lão hóa, ô nhiễm và stress." },
  { productName: "MAC Matte Lipstick - Chili", productCode: "MAC-LIP-001", brandIdx: 11, catIdx: 8, price: 580000, stock: 145, bought: 3210, averageRating: 4.5, shortDescription: "Son thỏi lì màu đỏ gạch huyền thoại", longDescription: "MAC Matte Lipstick shade Chili — màu đỏ gạch brownish-red huyền thoại, phù hợp mọi tông da. Lên màu chuẩn, bám môi lâu." },
  { productName: "Maybelline Sky High Mascara", productCode: "MAY-MAS-001", brandIdx: 1, catIdx: 1, price: 225000, stock: 190, bought: 1567, averageRating: 4.4, shortDescription: "Mascara vươn mi dài bất tận, không vón cục", longDescription: "Mascara Sky High với đầu cọ uốn cong giúp nâng mi và kéo dài từng sợi, tạo hiệu ứng mi tự nhiên mà vẫn ấn tượng." },
  { productName: "The Ordinary AHA 30% + BHA 2% Peeling Solution", productCode: "ORD-PEE-001", brandIdx: 2, catIdx: 0, price: 215000, stock: 160, bought: 1890, averageRating: 4.3, shortDescription: "Dung dịch peel da AHA/BHA tại nhà", longDescription: "Dung dịch tẩy tế bào chết hóa học với AHA 30% và BHA 2% giúp làm sáng da, thông thoáng lỗ chân lông. Sử dụng 1-2 lần/tuần." },
  { productName: "Innisfree Jeju Volcanic Pore Clay Mask", productCode: "INN-MSK-001", brandIdx: 3, catIdx: 7, price: 280000, stock: 140, bought: 987, averageRating: 4.4, shortDescription: "Mặt nạ đất sét núi lửa Jeju hút bã nhờn", longDescription: "Mặt nạ đất sét với tro núi lửa Jeju giúp hút sạch bã nhờn sâu trong lỗ chân lông, se khít lỗ chân lông và kiểm soát dầu thừa." },
  { productName: "Laneige Lip Sleeping Mask Berry", productCode: "LAN-LIP-001", brandIdx: 4, catIdx: 8, price: 395000, stock: 210, bought: 4100, averageRating: 4.9, shortDescription: "Mặt nạ ngủ môi hương berry bán chạy nhất Sephora", longDescription: "Mặt nạ ngủ môi với Berry Fruit Complex giúp tẩy tế bào chết nhẹ nhàng và dưỡng ẩm sâu cho đôi môi mềm mại suốt đêm." },
  { productName: "La Roche-Posay Effaclar Duo+", productCode: "LRP-ACN-001", brandIdx: 8, catIdx: 0, price: 520000, stock: 88, bought: 1234, averageRating: 4.5, shortDescription: "Kem dưỡng giảm mụn, ngừa thâm cho da dầu", longDescription: "Kem dưỡng đặc trị mụn với Niacinamide + Piroctone Olamine + LHA. Giảm mụn viêm, ngăn ngừa vết thâm, kiểm soát dầu suốt ngày." },
  { productName: "Cocoon Dầu Dừa Bến Tre", productCode: "COC-OIL-001", brandIdx: 9, catIdx: 3, price: 125000, stock: 400, bought: 5600, averageRating: 4.7, shortDescription: "Dầu dừa nguyên chất Bến Tre đa năng", longDescription: "Dầu dừa nguyên chất ép lạnh từ Bến Tre. Sử dụng đa năng: dưỡng tóc, dưỡng da, tẩy trang, dưỡng môi. 100% thuần chay." },
  { productName: "Bioderma Atoderm Intensive Balm", productCode: "BIO-BOD-001", brandIdx: 5, catIdx: 3, price: 485000, stock: 65, bought: 456, averageRating: 4.6, shortDescription: "Kem dưỡng ẩm chuyên sâu cho da rất khô và nhạy cảm", longDescription: "Kem dưỡng thể chuyên sâu với Skin Barrier Therapy™ giúp phục hồi hàng rào bảo vệ da, giảm ngứa và khô da kéo dài 24h." },
  { productName: "MAC Fix+ Setting Spray", productCode: "MAC-SET-001", brandIdx: 11, catIdx: 1, price: 620000, stock: 100, bought: 890, averageRating: 4.6, shortDescription: "Xịt giữ lớp trang điểm bền đẹp suốt ngày", longDescription: "Xịt khoáng đa năng với vitamin và khoáng chất giúp cố định lớp trang điểm, tạo lớp finish dewy tự nhiên và dưỡng ẩm cho da." },
  { productName: "Klairs Midnight Blue Calming Cream", productCode: "KLA-CRM-001", brandIdx: 7, catIdx: 0, price: 540000, stock: 70, bought: 678, averageRating: 4.5, shortDescription: "Kem dưỡng làm dịu da kích ứng, viêm đỏ", longDescription: "Kem dưỡng với Guaiazulene — hoạt chất chiết xuất từ hoa cúc giúp làm dịu da kích ứng, giảm đỏ, phù hợp sau peel da." },
  { productName: "Shiseido White Lucent Brightening Gel Cream", productCode: "SHI-CRM-001", brandIdx: 10, catIdx: 0, price: 1750000, stock: 5, bought: 145, averageRating: 4.7, shortDescription: "Kem dưỡng trắng sáng da công nghệ Nhật Bản", longDescription: "Kem dưỡng gel với công nghệ ReNeura Technology+™ và Sakura Bright Complex giúp làm sáng da, ngăn ngừa thâm nám." },
  { productName: "L'Oréal Paris UV Defender SPF50+", productCode: "LOR-SUN-001", brandIdx: 0, catIdx: 5, price: 289000, stock: 250, bought: 3200, averageRating: 4.5, shortDescription: "Kem chống nắng bảo vệ da khỏi tia UV và ô nhiễm", longDescription: "Kem chống nắng L'Oréal UV Defender bảo vệ toàn diện SPF50+ PA++++, chống tia UV, ô nhiễm và ánh sáng xanh từ điện thoại." },
  { productName: "Sulwhasoo Concentrated Ginseng Renewing Cream", productCode: "SUL-CRM-001", brandIdx: 6, catIdx: 0, price: 3250000, stock: 8, bought: 89, averageRating: 4.9, shortDescription: "Kem dưỡng nhân sâm chống lão hóa cao cấp nhất", longDescription: "Kem dưỡng chứa Ginsenoside Compound K tinh chế từ nhân sâm trồng 6 năm, giúp tái tạo và trẻ hóa da ở cấp độ tế bào." },
  { productName: "Maybelline Superstay Matte Ink", productCode: "MAY-LIP-001", brandIdx: 1, catIdx: 8, price: 195000, stock: 300, bought: 5400, averageRating: 4.4, shortDescription: "Son kem lì 16h không trôi, không chuyển màu", longDescription: "Son kem lì Maybelline Superstay Matte Ink với công thức siêu bền màu 16 giờ, không trôi khi ăn uống. Đầu son mũi tên độc đáo." },
];

// ─── ACCOUNTS (staff/admin) ──────────────────────────────
const accountsData = [
  { email: "nguyenthithanh@kanila.vn", username: "thanhnguyen", phone: "0901234567", accountType: "admin", accountStatus: "active" },
  { email: "tranthimai@kanila.vn", username: "maitran", phone: "0912345678", accountType: "staff", accountStatus: "active" },
  { email: "lehoanganh@kanila.vn", username: "anhle", phone: "0923456789", accountType: "staff", accountStatus: "active" },
  { email: "phamminhtuan@kanila.vn", username: "tuanpham", phone: "0934567890", accountType: "staff", accountStatus: "active" },
  { email: "vothikimchi@kanila.vn", username: "chivo", phone: "0945678901", accountType: "staff", accountStatus: "inactive" },
];

// ─── CUSTOMER ACCOUNTS ───────────────────────────────────
const customerAccountsData = [
  { email: "lethihuong@gmail.com", username: "huongle", phone: "0356789012", accountType: "customer", accountStatus: "active" },
  { email: "nguyenvantung@gmail.com", username: "tungnguyen", phone: "0367890123", accountType: "customer", accountStatus: "active" },
  { email: "tranthimy@gmail.com", username: "mytran", phone: "0378901234", accountType: "customer", accountStatus: "active" },
  { email: "phamthilan@gmail.com", username: "lanpham", phone: "0389012345", accountType: "customer", accountStatus: "active" },
  { email: "hoangthithao@gmail.com", username: "thaohoang", phone: "0390123456", accountType: "customer", accountStatus: "active" },
  { email: "dangvanduc@gmail.com", username: "ducdang", phone: "0812345678", accountType: "customer", accountStatus: "active" },
  { email: "buithikim@gmail.com", username: "kimbui", phone: "0823456789", accountType: "customer", accountStatus: "active" },
  { email: "ngothanhson@gmail.com", username: "sonngo", phone: "0834567890", accountType: "customer", accountStatus: "active" },
  { email: "vuthiyen@gmail.com", username: "yenvu", phone: "0845678901", accountType: "customer", accountStatus: "active" },
  { email: "dothibich@gmail.com", username: "bichdo", phone: "0856789012", accountType: "customer", accountStatus: "active" },
  { email: "lynguyen@gmail.com", username: "lyng", phone: "0867890123", accountType: "customer", accountStatus: "active" },
  { email: "tranminhanh@gmail.com", username: "anhtranm", phone: "0878901234", accountType: "customer", accountStatus: "active" },
  { email: "lehoaiphuong@gmail.com", username: "phuongle", phone: "0889012345", accountType: "customer", accountStatus: "active" },
  { email: "nguyenthithuy@outlook.com", username: "thuynguyen", phone: "0890123456", accountType: "customer", accountStatus: "active" },
  { email: "phamquocviet@gmail.com", username: "vietpham", phone: "0701234567", accountType: "customer", accountStatus: "active" },
];

// ─── CUSTOMERS (full name + profile) ─────────────────────
const customersTemplate = [
  { firstName: "Lê", lastName: "Thị Hương", fullName: "Lê Thị Hương", customerCode: "KNL-C0001", gender: "female", dateOfBirth: new Date("1995-03-15") },
  { firstName: "Nguyễn", lastName: "Văn Tùng", fullName: "Nguyễn Văn Tùng", customerCode: "KNL-C0002", gender: "male", dateOfBirth: new Date("1990-07-22") },
  { firstName: "Trần", lastName: "Thị Mỹ", fullName: "Trần Thị Mỹ", customerCode: "KNL-C0003", gender: "female", dateOfBirth: new Date("1998-11-08") },
  { firstName: "Phạm", lastName: "Thị Lan", fullName: "Phạm Thị Lan", customerCode: "KNL-C0004", gender: "female", dateOfBirth: new Date("1992-01-30") },
  { firstName: "Hoàng", lastName: "Thị Thảo", fullName: "Hoàng Thị Thảo", customerCode: "KNL-C0005", gender: "female", dateOfBirth: new Date("1997-05-12") },
  { firstName: "Đặng", lastName: "Văn Đức", fullName: "Đặng Văn Đức", customerCode: "KNL-C0006", gender: "male", dateOfBirth: new Date("1988-09-25") },
  { firstName: "Bùi", lastName: "Thị Kim", fullName: "Bùi Thị Kim", customerCode: "KNL-C0007", gender: "female", dateOfBirth: new Date("2000-12-03") },
  { firstName: "Ngô", lastName: "Thanh Sơn", fullName: "Ngô Thanh Sơn", customerCode: "KNL-C0008", gender: "male", dateOfBirth: new Date("1993-04-18") },
  { firstName: "Vũ", lastName: "Thị Yến", fullName: "Vũ Thị Yến", customerCode: "KNL-C0009", gender: "female", dateOfBirth: new Date("1996-08-07") },
  { firstName: "Đỗ", lastName: "Thị Bích", fullName: "Đỗ Thị Bích", customerCode: "KNL-C0010", gender: "female", dateOfBirth: new Date("1994-02-14") },
  { firstName: "Lý", lastName: "Nguyên", fullName: "Lý Nguyên", customerCode: "KNL-C0011", gender: "male", dateOfBirth: new Date("1991-06-28") },
  { firstName: "Trần", lastName: "Minh Anh", fullName: "Trần Minh Anh", customerCode: "KNL-C0012", gender: "female", dateOfBirth: new Date("1999-10-11") },
  { firstName: "Lê", lastName: "Hoài Phương", fullName: "Lê Hoài Phương", customerCode: "KNL-C0013", gender: "female", dateOfBirth: new Date("1997-07-04") },
  { firstName: "Nguyễn", lastName: "Thị Thuỷ", fullName: "Nguyễn Thị Thuỷ", customerCode: "KNL-C0014", gender: "female", dateOfBirth: new Date("2001-03-20") },
  { firstName: "Phạm", lastName: "Quốc Việt", fullName: "Phạm Quốc Việt", customerCode: "KNL-C0015", gender: "male", dateOfBirth: new Date("1989-11-16") },
];

// ─── PROMOTIONS ───────────────────────────────────────────
const promotionsData = [
  { promotionCode: "SUMMER2026", promotionName: "Khuyến mãi Hè 2026", description: "Giảm 20% toàn bộ sản phẩm chống nắng trong mùa hè", promotionType: "seasonal", discountType: "percentage", discountValue: 20, maxDiscountAmount: 200000, startAt: new Date("2026-05-01"), endAt: new Date("2026-08-31"), usageLimitTotal: 1000, usageLimitPerCustomer: 3, isAutoApply: false, priority: 1, promotionStatus: "active" },
  { promotionCode: "NEWMEMBER", promotionName: "Ưu đãi Thành viên mới", description: "Giảm 15% cho đơn hàng đầu tiên của khách hàng mới", promotionType: "welcome", discountType: "percentage", discountValue: 15, maxDiscountAmount: 150000, startAt: new Date("2026-01-01"), endAt: new Date("2026-12-31"), usageLimitTotal: 5000, usageLimitPerCustomer: 1, isAutoApply: true, priority: 2, promotionStatus: "active" },
  { promotionCode: "FLASHSALE38", promotionName: "Flash Sale 8/3 Ngày Phụ Nữ", description: "Giảm 30% son môi và trang điểm nhân ngày 8/3", promotionType: "flash_sale", discountType: "percentage", discountValue: 30, maxDiscountAmount: 300000, startAt: new Date("2026-03-07"), endAt: new Date("2026-03-09"), usageLimitTotal: 500, usageLimitPerCustomer: 2, isAutoApply: false, priority: 3, promotionStatus: "active" },
  { promotionCode: "FREESHIP50K", promotionName: "Miễn phí vận chuyển đơn từ 500K", description: "Miễn phí giao hàng cho đơn từ 500.000₫ trở lên", promotionType: "shipping", discountType: "fixed", discountValue: 30000, maxDiscountAmount: 30000, startAt: new Date("2026-01-01"), endAt: new Date("2026-12-31"), usageLimitTotal: 10000, isAutoApply: true, priority: 0, promotionStatus: "active" },
  { promotionCode: "BIRTHDAY25", promotionName: "Quà sinh nhật giảm 25%", description: "Giảm 25% nhân dịp sinh nhật khách hàng thân thiết", promotionType: "birthday", discountType: "percentage", discountValue: 25, maxDiscountAmount: 250000, startAt: new Date("2026-01-01"), endAt: new Date("2026-12-31"), usageLimitTotal: 0, usageLimitPerCustomer: 1, isAutoApply: false, priority: 4, promotionStatus: "active" },
  { promotionCode: "BUY2GET1", promotionName: "Mua 2 tặng 1 Skincare", description: "Mua 2 sản phẩm chăm sóc da, được tặng 1 sản phẩm giá thấp nhất", promotionType: "bundle", discountType: "percentage", discountValue: 33, maxDiscountAmount: 500000, startAt: new Date("2026-04-01"), endAt: new Date("2026-04-30"), usageLimitTotal: 200, usageLimitPerCustomer: 1, isAutoApply: false, priority: 5, promotionStatus: "draft" },
];

// ─── COUPONS ──────────────────────────────────────────────
const couponsTemplate = [
  { couponCode: "WELCOME10", promoIdx: 1, validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimitTotal: 2000, usageLimitPerCustomer: 1, minOrderAmount: 200000, couponStatus: "active" },
  { couponCode: "SUMMER20", promoIdx: 0, validFrom: new Date("2026-05-01"), validTo: new Date("2026-08-31"), usageLimitTotal: 500, usageLimitPerCustomer: 2, minOrderAmount: 300000, couponStatus: "active" },
  { couponCode: "PNQUEEN", promoIdx: 2, validFrom: new Date("2026-03-07"), validTo: new Date("2026-03-09"), usageLimitTotal: 300, usageLimitPerCustomer: 1, minOrderAmount: 150000, couponStatus: "active" },
  { couponCode: "FREESHIP", promoIdx: 3, validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimitTotal: 5000, usageLimitPerCustomer: 5, minOrderAmount: 500000, couponStatus: "active" },
  { couponCode: "HAPPYBDAY", promoIdx: 4, validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimitTotal: 0, usageLimitPerCustomer: 1, minOrderAmount: 100000, couponStatus: "active" },
  { couponCode: "KANILA50K", promoIdx: 0, validFrom: new Date("2026-06-01"), validTo: new Date("2026-06-30"), usageLimitTotal: 100, usageLimitPerCustomer: 1, minOrderAmount: 400000, couponStatus: "active" },
  { couponCode: "VIP2026", promoIdx: 4, validFrom: new Date("2026-01-01"), validTo: new Date("2026-12-31"), usageLimitTotal: 50, usageLimitPerCustomer: 1, minOrderAmount: 1000000, couponStatus: "active" },
  { couponCode: "SKINLOVE", promoIdx: 5, validFrom: new Date("2026-04-01"), validTo: new Date("2026-04-30"), usageLimitTotal: 150, usageLimitPerCustomer: 1, minOrderAmount: 250000, couponStatus: "active" },
];

// ─── REVIEW TEMPLATES ─────────────────────────────────────
const reviewTemplates = [
  { rating: 5, reviewTitle: "Sản phẩm tuyệt vời!", reviewContent: "Dùng rồi da mình thay đổi hẳn, mềm mịn hơn nhiều. Sẽ mua lại!", reviewStatus: "approved" },
  { rating: 4, reviewTitle: "Hài lòng", reviewContent: "Chất lượng tốt, giao hàng nhanh. Chỉ hơi đắt một chút.", reviewStatus: "approved" },
  { rating: 5, reviewTitle: "Đáng đồng tiền bát gạo", reviewContent: "Mình đã dùng hết 3 lọ rồi, da sáng lên rõ rệt. Recommend cho mọi người!", reviewStatus: "approved" },
  { rating: 3, reviewTitle: "Bình thường", reviewContent: "Sản phẩm ổn nhưng chưa thấy hiệu quả rõ ràng sau 2 tuần sử dụng.", reviewStatus: "approved" },
  { rating: 5, reviewTitle: "Mua hoài không chán", reviewContent: "Lần nào cũng mua, chất lượng luôn ổn định. Đóng gói cẩn thận.", reviewStatus: "approved" },
  { rating: 4, reviewTitle: "Phù hợp da mình", reviewContent: "Da mình nhạy cảm mà dùng sản phẩm này không bị kích ứng. Thích!", reviewStatus: "approved" },
  { rating: 2, reviewTitle: "Không phù hợp", reviewContent: "Mình bị dị ứng khi dùng sản phẩm này, có lẽ không hợp da mình.", reviewStatus: "approved" },
  { rating: 5, reviewTitle: "Giá tốt, chất lượng cao", reviewContent: "So với các sản phẩm cùng phân khúc thì giá rất hợp lý. Rất đáng mua!", reviewStatus: "approved" },
  { rating: 4, reviewTitle: "Giao hàng nhanh", reviewContent: "Đặt hàng tối, sáng hôm sau đã nhận được. Sản phẩm chính hãng.", reviewStatus: "approved" },
  { rating: 5, reviewTitle: "Da mình đẹp lên trông thấy", reviewContent: "Sau 1 tháng sử dụng, nám giảm đi rõ rệt. Cảm ơn KANILA!", reviewStatus: "approved" },
  { rating: 3, reviewTitle: "Mùi hơi nồng", reviewContent: "Hiệu quả dưỡng da tốt nhưng mùi hơi nồng, mong hãng cải thiện.", reviewStatus: "pending" },
  { rating: 4, reviewTitle: "Tốt cho da dầu", reviewContent: "Da mình dầu mà dùng sản phẩm này kiềm dầu tốt lắm, da sạch hơn.", reviewStatus: "approved" },
];

// ─── MAIN SEED FUNCTION ──────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // --- Clean existing data (optional — keeps ngan@gmail.com admin) ---
    const collections = [
      "brands",
      "categories",
      "productmedias",
      "products",
      "customers",
      "orders",
      "orderitems",
      "ordertotals",
      "promotions",
      "coupons",
      "reviews",
      "shipments",
    ];
    for (const col of collections) {
      if (mongoose.connection.collections[col]) {
        await mongoose.connection.collections[col].deleteMany({});
        console.log(`  🗑️  Cleared ${col}`);
      }
    }

    // 1. BRANDS
    const brands = await Brand.insertMany(brandsData);
    console.log(`✅ Inserted ${brands.length} brands`);

    // 2. CATEGORIES
    const categories = await Category.insertMany(categoriesData);
    console.log(`✅ Inserted ${categories.length} categories`);

    // 3. PRODUCTS
    const products = await Product.insertMany(
      productsTemplate.map(p => ({
        productName: p.productName,
        productCode: p.productCode,
        brandId: brands[p.brandIdx]._id,
        categoryId: categories[p.catIdx]._id,
        price: p.price,
        stock: p.stock,
        bought: p.bought,
        averageRating: p.averageRating,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        isActive: true,
      }))
    );
    console.log(`✅ Inserted ${products.length} products`);

    // 3b. PRODUCT MEDIA (primary image per product — deterministic picsum seed per SKU)
    const productMediaPayload = products.map((prod) => {
      const mediaUrl = `https://picsum.photos/seed/kanila-${encodeURIComponent(prod.productCode)}/400/400`;
      return {
        productId: prod._id,
        mediaType: "image",
        mediaUrl,
        altText: prod.productName.substring(0, 255),
        sortOrder: 0,
        isPrimary: true,
      };
    });
    await ProductMedia.insertMany(productMediaPayload);
    await Product.bulkWrite(
      products.map((p, i) => ({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { imageUrl: productMediaPayload[i].mediaUrl } },
        },
      }))
    );
    console.log(`✅ Inserted ${productMediaPayload.length} product media rows and synced imageUrl`);

    // 4. STAFF/ADMIN ACCOUNTS (skip duplicates)
    const passwordHash = await bcrypt.hash("kanila2026", 10);
    const staffAccounts = [];
    for (const a of accountsData) {
      const existing = await Account.findOne({ email: a.email });
      if (existing) {
        staffAccounts.push(existing);
      } else {
        const acc = await Account.create({ ...a, passwordHash, emailVerifiedAt: new Date(), lastLoginAt: new Date(Date.now() - Math.random() * 7 * 86400000) });
        staffAccounts.push(acc);
      }
    }
    console.log(`✅ Created/found ${staffAccounts.length} staff accounts`);

    // 5. CUSTOMER ACCOUNTS
    const custPasswordHash = await bcrypt.hash("khachhang123", 10);
    const custAccounts = [];
    for (const a of customerAccountsData) {
      const existing = await Account.findOne({ email: a.email });
      if (existing) {
        custAccounts.push(existing);
      } else {
        const acc = await Account.create({ ...a, passwordHash: custPasswordHash, emailVerifiedAt: new Date(), lastLoginAt: new Date(Date.now() - Math.random() * 30 * 86400000) });
        custAccounts.push(acc);
      }
    }
    console.log(`✅ Created/found ${custAccounts.length} customer accounts`);

    // 6. CUSTOMERS
    const customers = [];
    for (let i = 0; i < customersTemplate.length; i++) {
      const existing = await Customer.findOne({ customerCode: customersTemplate[i].customerCode });
      if (existing) {
        customers.push(existing);
      } else {
        const cust = await Customer.create({
          ...customersTemplate[i],
          accountId: custAccounts[i]._id,
          customerStatus: "active",
          registeredAt: new Date(Date.now() - Math.random() * 180 * 86400000),
        });
        customers.push(cust);
      }
    }
    console.log(`✅ Created/found ${customers.length} customers`);

    // 7. PROMOTIONS
    const promotions = await Promotion.insertMany(
      promotionsData.map(p => ({ ...p, createdByAccountId: staffAccounts[0]._id }))
    );
    console.log(`✅ Inserted ${promotions.length} promotions`);

    // 8. COUPONS
    const coupons = await Coupon.insertMany(
      couponsTemplate.map(c => ({
        promotionId: promotions[c.promoIdx]._id,
        couponCode: c.couponCode,
        validFrom: c.validFrom,
        validTo: c.validTo,
        usageLimitTotal: c.usageLimitTotal,
        usageLimitPerCustomer: c.usageLimitPerCustomer,
        minOrderAmount: c.minOrderAmount,
        couponStatus: c.couponStatus,
      }))
    );
    console.log(`✅ Inserted ${coupons.length} coupons`);

    // 9. ORDERS (20 realistic orders across customers)
    const orderStatuses = ["pending", "confirmed", "processing", "completed", "completed", "completed", "completed", "completed", "cancelled"];
    const paymentStatuses = ["unpaid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "refunded"];
    const orders = [];
    for (let i = 0; i < 20; i++) {
      const custIdx = i % customers.length;
      const statusIdx = i % orderStatuses.length;
      // Spread orders across the last 90 days so revenue charts have visible points
      const daysAgo = Math.min(89, (i * 11 + 5) % 90);
      const placedAt = new Date(Date.now() - daysAgo * 86400000);
      const orderNum = `KNL${String(2026031000 + i)}`;

      const order = await Order.create({
        orderNumber: orderNum,
        customerId: customers[custIdx]._id,
        orderStatus: orderStatuses[statusIdx],
        paymentStatus: paymentStatuses[statusIdx],
        fulfillmentStatus: orderStatuses[statusIdx] === "completed" ? "fulfilled" : "unfulfilled",
        placedAt,
        confirmedAt: ["confirmed", "processing", "completed"].includes(orderStatuses[statusIdx]) ? new Date(placedAt.getTime() + 3600000) : null,
        currencyCode: "VND",
        customerNote: i % 3 === 0 ? "Giao giờ hành chính" : "",
      });
      orders.push(order);

      // 2-4 items per order
      const numItems = 2 + Math.floor(Math.random() * 3);
      let subtotal = 0;
      for (let j = 0; j < numItems; j++) {
        const prodIdx = (i * 3 + j) % products.length;
        const qty = 1 + Math.floor(Math.random() * 3);
        const unitPrice = products[prodIdx].price;
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        await OrderItem.create({
          orderId: order._id,
          productId: products[prodIdx]._id,
          variantId: products[prodIdx]._id, // using productId as placeholder for variant
          skuSnapshot: products[prodIdx].productCode,
          productNameSnapshot: products[prodIdx].productName,
          variantNameSnapshot: "Mặc định",
          quantity: qty,
          unitListPriceAmount: unitPrice,
          unitSalePriceAmount: unitPrice,
          unitFinalPriceAmount: unitPrice,
          lineSubtotalAmount: lineTotal,
          lineDiscountAmount: 0,
          lineTotalAmount: lineTotal,
        });
      }

      const shippingFee = subtotal >= 500000 ? 0 : 30000;
      await OrderTotal.create({
        orderId: order._id,
        subtotalAmount: subtotal,
        itemDiscountAmount: 0,
        orderDiscountAmount: 0,
        shippingFeeAmount: shippingFee,
        taxAmount: 0,
        grandTotalAmount: subtotal + shippingFee,
      });
    }
    console.log(`✅ Inserted ${orders.length} orders with items and totals`);

    // 10. SHIPMENTS
    const shippedOrders = orders.filter(o => ["confirmed", "processing", "completed"].includes(o.orderStatus));
    const carriers = ["GHTK", "GHN", "VNPost", "JT Express", "Ninja Van"];
    for (let i = 0; i < shippedOrders.length; i++) {
      const carrier = carriers[i % carriers.length];
      await Shipment.create({
        orderId: shippedOrders[i]._id,
        shipmentNumber: `SHP${String(2026030100 + i)}`,
        carrierCode: carrier,
        serviceName: carrier === "GHTK" ? "Nhanh" : carrier === "GHN" ? "Express" : "Tiêu chuẩn",
        trackingNumber: `VN${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
        shipmentStatus: shippedOrders[i].orderStatus === "completed" ? "delivered" : "in_transit",
        shippedAt: new Date(shippedOrders[i].placedAt.getTime() + 86400000),
        deliveredAt: shippedOrders[i].orderStatus === "completed" ? new Date(shippedOrders[i].placedAt.getTime() + 3 * 86400000) : null,
        shippingFeeAmount: 30000,
      });
    }
    console.log(`✅ Inserted ${shippedOrders.length} shipments`);

    // 11. REVIEWS
    const reviewsCreated = [];
    for (let i = 0; i < 30; i++) {
      const template = reviewTemplates[i % reviewTemplates.length];
      const custIdx = i % customers.length;
      const prodIdx = i % products.length;
      const review = await Review.create({
        customerId: customers[custIdx]._id,
        productId: products[prodIdx]._id,
        rating: template.rating,
        reviewTitle: template.reviewTitle,
        reviewContent: template.reviewContent,
        reviewStatus: template.reviewStatus,
        verifiedPurchaseFlag: Math.random() > 0.3,
        helpfulCount: Math.floor(Math.random() * 25),
        approvedByAccountId: template.reviewStatus === "approved" ? staffAccounts[0]._id : null,
        approvedAt: template.reviewStatus === "approved" ? new Date() : null,
      });
      reviewsCreated.push(review);
    }
    console.log(`✅ Inserted ${reviewsCreated.length} reviews`);

    // --- SUMMARY ---
    console.log("\n═══════════════════════════════════════");
    console.log("  🎉 KANILA SEED DATA COMPLETE!");
    console.log("═══════════════════════════════════════");
    console.log(`  Brands:      ${brands.length}`);
    console.log(`  Categories:  ${categories.length}`);
    console.log(`  Products:    ${products.length}`);
    console.log(`  Accounts:    ${staffAccounts.length + custAccounts.length}`);
    console.log(`  Customers:   ${customers.length}`);
    console.log(`  Orders:      ${orders.length}`);
    console.log(`  Promotions:  ${promotions.length}`);
    console.log(`  Coupons:     ${coupons.length}`);
    console.log(`  Shipments:   ${shippedOrders.length}`);
    console.log(`  Reviews:     ${reviewsCreated.length}`);
    console.log("═══════════════════════════════════════\n");

  } catch (err) {
    console.error("❌ Seed error:", err.message);
    if (err.writeErrors) {
      err.writeErrors.forEach(e => console.error("  →", e.errmsg));
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

seed();
