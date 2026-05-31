import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Xóa sạch dữ liệu cũ (an toàn khi chạy lại nhiều lần) ──────────────────────────────
  console.log('🧹 Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleaned\n');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── CỬA HÀNG 1: LUMIÈRE — Thời trang Thiết kế ───────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { email: 'alice@lumiere.store' },
    update: {},
    create: {
      email: 'alice@lumiere.store',
      passwordHash,
      name: 'Alice Nguyen',
      role: 'SELLER',
    },
  });

  const lumiere = await prisma.shop.upsert({
    where: { slug: 'lumiere' },
    update: {},
    create: {
      name: 'Lumière',
      slug: 'lumiere',
      description:
        'Curated fashion essentials for the modern wardrobe. Minimal, timeless, effortless.',
      contactEmail: 'hello@lumiere.store',
      contactPhone: '+84 90 123 4567',
      address: '12 Đồng Khởi, Quận 1, TP. Hồ Chí Minh',
      ownerId: alice.id,
    },
  });

  console.log('✅ Created shop:', lumiere.slug);

  const catApparel = await prisma.category.create({
    data: { name: 'Apparel', slug: 'apparel', shopId: lumiere.id },
  });
  const catAccessories = await prisma.category.create({
    data: { name: 'Accessories', slug: 'accessories', shopId: lumiere.id },
  });
  const catBags = await prisma.category.create({
    data: { name: 'Bags', slug: 'bags', shopId: lumiere.id },
  });
  const catOuterwear = await prisma.category.create({
    data: { name: 'Outerwear', slug: 'outerwear', shopId: lumiere.id },
  });

  // Sản phẩm 1 — Áo sơ mi Linen
  const linenShirt = await prisma.product.create({
    data: {
      name: 'Linen Relaxed Shirt',
      description:
        'Breathable 100% linen shirt with a relaxed silhouette. Perfect for warm-weather dressing — pair with trousers or wear open over a tee.',
      shopId: lumiere.id,
      categoryId: catApparel.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600',
      attributes: {
        create: [
          { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Sand', 'Slate', 'White'] },
        ],
      },
      variants: {
        create: [
          { label: 'S / Sand', options: { Size: 'S', Color: 'Sand' }, price: 59.0, stock: 12 },
          { label: 'M / Sand', options: { Size: 'M', Color: 'Sand' }, price: 59.0, stock: 18, isDefault: true },
          { label: 'L / Sand', options: { Size: 'L', Color: 'Sand' }, price: 59.0, stock: 10 },
          { label: 'S / Slate', options: { Size: 'S', Color: 'Slate' }, price: 59.0, stock: 8 },
          { label: 'M / Slate', options: { Size: 'M', Color: 'Slate' }, price: 59.0, stock: 14 },
          { label: 'L / Slate', options: { Size: 'L', Color: 'Slate' }, price: 59.0, stock: 6 },
          { label: 'S / White', options: { Size: 'S', Color: 'White' }, price: 59.0, stock: 15 },
          { label: 'M / White', options: { Size: 'M', Color: 'White' }, price: 59.0, stock: 20 },
          { label: 'L / White', options: { Size: 'L', Color: 'White' }, price: 59.0, stock: 9 },
          { label: 'XL / White', options: { Size: 'XL', Color: 'White' }, price: 59.0, stock: 4 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 2 — Quần tây ống rộng
  const trousers = await prisma.product.create({
    data: {
      name: 'High-Rise Wide-Leg Trousers',
      description:
        'Tailored wide-leg trousers with a high rise and clean front crease. Cut from a structured fabric blend that drapes beautifully.',
      shopId: lumiere.id,
      categoryId: catApparel.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
      attributes: {
        create: [
          { name: 'Size', options: ['XS', 'S', 'M', 'L'] },
          { name: 'Color', options: ['Black', 'Cream', 'Mocha'] },
        ],
      },
      variants: {
        create: [
          { label: 'XS / Black', options: { Size: 'XS', Color: 'Black' }, price: 89.0, stock: 6 },
          { label: 'S / Black', options: { Size: 'S', Color: 'Black' }, price: 89.0, stock: 14, isDefault: true },
          { label: 'M / Black', options: { Size: 'M', Color: 'Black' }, price: 89.0, stock: 18 },
          { label: 'L / Black', options: { Size: 'L', Color: 'Black' }, price: 89.0, stock: 8 },
          { label: 'S / Cream', options: { Size: 'S', Color: 'Cream' }, price: 89.0, stock: 10 },
          { label: 'M / Cream', options: { Size: 'M', Color: 'Cream' }, price: 89.0, stock: 12 },
          { label: 'S / Mocha', options: { Size: 'S', Color: 'Mocha' }, price: 89.0, stock: 5 },
          { label: 'M / Mocha', options: { Size: 'M', Color: 'Mocha' }, price: 89.0, stock: 7 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 3 — Khăn lụa (Đang giảm giá)
  await prisma.product.create({
    data: {
      name: 'Silk Twill Scarf',
      description:
        'A 90×90 cm silk twill scarf featuring an abstract floral print. Wear it tied at the neck, in your hair, or on a bag handle.',
      shopId: lumiere.id,
      categoryId: catAccessories.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600',
      attributes: {
        create: [{ name: 'Print', options: ['Floral Black', 'Floral Ivory', 'Geometric Blue'] }],
      },
      variants: {
        create: [
          { label: 'Floral Black', options: { Print: 'Floral Black' }, price: 45.0, comparePrice: 65.0, stock: 20, isDefault: true },
          { label: 'Floral Ivory', options: { Print: 'Floral Ivory' }, price: 45.0, comparePrice: 65.0, stock: 15 },
          { label: 'Geometric Blue', options: { Print: 'Geometric Blue' }, price: 45.0, comparePrice: 65.0, stock: 8 },
        ],
      },
    },
  });

  // Sản phẩm 4 — Thắt lưng da quấn
  await prisma.product.create({
    data: {
      name: 'Leather Wrap Belt',
      description:
        'Hand-finished vegetable-tanned leather belt with a minimalist buckle. Complements dresses, blouses, and tailored trousers.',
      shopId: lumiere.id,
      categoryId: catAccessories.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
      attributes: {
        create: [
          { name: 'Color', options: ['Tan', 'Black'] },
          { name: 'Length', options: ['S', 'M', 'L'] },
        ],
      },
      variants: {
        create: [
          { label: 'Tan / S', options: { Color: 'Tan', Length: 'S' }, price: 38.0, stock: 18, isDefault: true },
          { label: 'Tan / M', options: { Color: 'Tan', Length: 'M' }, price: 38.0, stock: 22 },
          { label: 'Black / M', options: { Color: 'Black', Length: 'M' }, price: 38.0, stock: 16 },
          { label: 'Black / L', options: { Color: 'Black', Length: 'L' }, price: 38.0, stock: 12 },
        ],
      },
    },
  });

  // Sản phẩm 5 — Túi Tote vải Canvas
  const canvasTote = await prisma.product.create({
    data: {
      name: 'Canvas Structured Tote',
      description:
        'A roomy, structured tote crafted from heavyweight washed canvas. Features a zip closure, interior pocket, and reinforced handles.',
      shopId: lumiere.id,
      categoryId: catBags.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
      attributes: {
        create: [{ name: 'Color', options: ['Natural', 'Black', 'Forest Green'] }],
      },
      variants: {
        create: [
          { label: 'Natural', options: { Color: 'Natural' }, price: 78.0, stock: 25, isDefault: true },
          { label: 'Black', options: { Color: 'Black' }, price: 78.0, stock: 30 },
          { label: 'Forest Green', options: { Color: 'Forest Green' }, price: 78.0, stock: 12 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 6 — Túi đeo vai mini
  await prisma.product.create({
    data: {
      name: 'Mini Shoulder Bag',
      description:
        'Compact leather shoulder bag with a removable strap and polished brass hardware. Ideal for city days and evening occasions.',
      shopId: lumiere.id,
      categoryId: catBags.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1512641407323-51c321a29aaa?w=600',
      attributes: {
        create: [{ name: 'Color', options: ['Cream', 'Black'] }],
      },
      variants: {
        create: [
          { label: 'Cream', options: { Color: 'Cream' }, price: 69.0, stock: 14, isDefault: true },
          { label: 'Black', options: { Color: 'Black' }, price: 69.0, stock: 18 },
        ],
      },
    },
  });

  // Sản phẩm 7 — Áo len Merino
  const merinoSweater = await prisma.product.create({
    data: {
      name: 'Fine Merino Knit Sweater',
      description:
        'Ultra-soft 100% merino wool knit in a relaxed fit. Naturally temperature-regulating — light enough for layering, warm enough to stand alone.',
      shopId: lumiere.id,
      categoryId: catOuterwear.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600',
      attributes: {
        create: [
          { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Oatmeal', 'Charcoal', 'Dusty Rose'] },
        ],
      },
      variants: {
        create: [
          { label: 'S / Oatmeal', options: { Size: 'S', Color: 'Oatmeal' }, price: 120.0, stock: 10 },
          { label: 'M / Oatmeal', options: { Size: 'M', Color: 'Oatmeal' }, price: 120.0, stock: 14, isDefault: true },
          { label: 'L / Oatmeal', options: { Size: 'L', Color: 'Oatmeal' }, price: 120.0, stock: 8 },
          { label: 'S / Charcoal', options: { Size: 'S', Color: 'Charcoal' }, price: 120.0, stock: 12 },
          { label: 'M / Charcoal', options: { Size: 'M', Color: 'Charcoal' }, price: 120.0, stock: 16 },
          { label: 'L / Charcoal', options: { Size: 'L', Color: 'Charcoal' }, price: 120.0, stock: 6 },
          { label: 'S / Dusty Rose', options: { Size: 'S', Color: 'Dusty Rose' }, price: 120.0, stock: 7 },
          { label: 'M / Dusty Rose', options: { Size: 'M', Color: 'Dusty Rose' }, price: 120.0, stock: 9 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 8 — Áo khoác Trench mỏng nhẹ (Đang giảm giá)
  const trenchCoat = await prisma.product.create({
    data: {
      name: 'Lightweight Trench Coat',
      description:
        'Water-resistant trench with a removable belt and subtle shoulder epaulets. Designed for easy layering from spring to autumn.',
      shopId: lumiere.id,
      categoryId: catOuterwear.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1520962915122-8bcbf628a0f0?w=600',
      attributes: {
        create: [
          { name: 'Size', options: ['S', 'M', 'L'] },
          { name: 'Color', options: ['Sand', 'Olive'] },
        ],
      },
      variants: {
        create: [
          { label: 'S / Sand', options: { Size: 'S', Color: 'Sand' }, price: 145.0, comparePrice: 189.0, stock: 10 },
          { label: 'M / Sand', options: { Size: 'M', Color: 'Sand' }, price: 145.0, comparePrice: 189.0, stock: 12, isDefault: true },
          { label: 'L / Sand', options: { Size: 'L', Color: 'Sand' }, price: 145.0, comparePrice: 189.0, stock: 8 },
          { label: 'S / Olive', options: { Size: 'S', Color: 'Olive' }, price: 145.0, comparePrice: 189.0, stock: 9 },
          { label: 'M / Olive', options: { Size: 'M', Color: 'Olive' }, price: 145.0, comparePrice: 189.0, stock: 11 },
        ],
      },
    },
    include: { variants: true },
  });

  console.log('✅ Created 8 products for Lumière');

  // ─── CỬA HÀNG 2: VOLT TECH — Phụ kiện Công nghệ ────────────────────────────────
  const ben = await prisma.user.upsert({
    where: { email: 'ben@volttech.shop' },
    update: {},
    create: {
      email: 'ben@volttech.shop',
      passwordHash,
      name: 'Ben Tran',
      role: 'SELLER',
    },
  });

  const volt = await prisma.shop.upsert({
    where: { slug: 'volttech' },
    update: {},
    create: {
      name: 'Volt Tech',
      slug: 'volttech',
      description:
        'Premium tech accessories for creators and professionals. Charge faster, work smarter, look better.',
      contactEmail: 'support@volttech.shop',
      contactPhone: '+84 98 765 4321',
      address: '45 Cầu Giấy, Hà Nội',
      ownerId: ben.id,
    },
  });

  console.log('✅ Created shop:', volt.slug);

  const catCables = await prisma.category.create({
    data: { name: 'Cables & Charging', slug: 'cables-charging', shopId: volt.id },
  });
  const catAudio = await prisma.category.create({
    data: { name: 'Audio', slug: 'audio', shopId: volt.id },
  });
  const catDesk = await prisma.category.create({
    data: { name: 'Desk Setup', slug: 'desk-setup', shopId: volt.id },
  });
  const catPhoneGear = await prisma.category.create({
    data: { name: 'Phone Gear', slug: 'phone-gear', shopId: volt.id },
  });

  // Sản phẩm 1 — Hub chuyển đổi USB-C
  const usbHub = await prisma.product.create({
    data: {
      name: '7-in-1 USB-C Hub',
      description:
        "Expand your laptop's connectivity with 4K HDMI, 2× USB-A 3.0, USB-C PD 100W passthrough, SD, microSD, and 3.5mm audio jack. Plug-and-play, no drivers needed.",
      shopId: volt.id,
      categoryId: catDesk.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
      attributes: {
        create: [{ name: 'Color', options: ['Space Grey', 'Silver'] }],
      },
      variants: {
        create: [
          { label: 'Space Grey', options: { Color: 'Space Grey' }, price: 49.99, stock: 50, isDefault: true },
          { label: 'Silver', options: { Color: 'Silver' }, price: 49.99, stock: 35 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 2 — Tấm lót bàn di chuột da cỡ XL
  const deskMat = await prisma.product.create({
    data: {
      name: 'XL Leather Desk Mat',
      description:
        'Full-grain PU leather surface with a micro-textured finish for smooth mouse glide. Non-slip rubber base, stitched edges. 90×40 cm.',
      shopId: volt.id,
      categoryId: catDesk.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=600',
      attributes: {
        create: [{ name: 'Color', options: ['Black', 'Dark Brown', 'Tan'] }],
      },
      variants: {
        create: [
          { label: 'Black', options: { Color: 'Black' }, price: 55.0, stock: 60, isDefault: true },
          { label: 'Dark Brown', options: { Color: 'Dark Brown' }, price: 55.0, stock: 45 },
          { label: 'Tan', options: { Color: 'Tan' }, price: 55.0, stock: 30 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 3 — Cáp sạc bọc dù USB-C
  const braidedCable = await prisma.product.create({
    data: {
      name: 'USB-C to USB-C Braided Cable',
      description:
        '240W fast-charge rated, 480 Mbps data transfer. Nylon-braided outer sleeve with reinforced connectors rated for 30,000+ bends. Available in 1m and 2m lengths.',
      shopId: volt.id,
      categoryId: catCables.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1583394293214-5de0b5c28ba5?w=600',
      attributes: {
        create: [
          { name: 'Length', options: ['1m', '2m'] },
          { name: 'Color', options: ['Black', 'White', 'Sage'] },
        ],
      },
      variants: {
        create: [
          { label: '1m / Black', options: { Length: '1m', Color: 'Black' }, price: 18.0, stock: 80, isDefault: true },
          { label: '1m / White', options: { Length: '1m', Color: 'White' }, price: 18.0, stock: 65 },
          { label: '1m / Sage', options: { Length: '1m', Color: 'Sage' }, price: 18.0, stock: 40 },
          { label: '2m / Black', options: { Length: '2m', Color: 'Black' }, price: 22.0, stock: 60 },
          { label: '2m / White', options: { Length: '2m', Color: 'White' }, price: 22.0, stock: 50 },
          { label: '2m / Sage', options: { Length: '2m', Color: 'Sage' }, price: 22.0, stock: 28 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 4 — Củ sạc nhanh GaN 65W
  const ganCharger = await prisma.product.create({
    data: {
      name: '65W GaN Fast Charger',
      description:
        'Compact GaN wall charger with dual USB-C ports and 65W total power delivery. Ideal for laptops, tablets, and phones while saving desk space.',
      shopId: volt.id,
      categoryId: catCables.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1581291519195-ef11498d1cf5?w=600',
      attributes: {
        create: [{ name: 'Port', options: ['1×USB-C', '2×USB-C'] }],
      },
      variants: {
        create: [
          { label: '1×USB-C', options: { Port: '1×USB-C' }, price: 39.0, stock: 55, isDefault: true },
          { label: '2×USB-C', options: { Port: '2×USB-C' }, price: 49.0, stock: 32 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 5 — Tai nghe ProBuds X (Đang giảm giá)
  const probuds = await prisma.product.create({
    data: {
      name: 'ProBuds X Active Noise Cancelling',
      description:
        'Up to 32 hours total battery (8hr buds + 24hr case), ANC with transparency mode, IPX5 water resistance, and multipoint connection for 2 devices simultaneously.',
      shopId: volt.id,
      categoryId: catAudio.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600',
      attributes: {
        create: [{ name: 'Color', options: ['Obsidian', 'Pearl White', 'Slate Blue'] }],
      },
      variants: {
        create: [
          { label: 'Obsidian', options: { Color: 'Obsidian' }, price: 129.0, comparePrice: 159.0, stock: 40, isDefault: true },
          { label: 'Pearl White', options: { Color: 'Pearl White' }, price: 129.0, comparePrice: 159.0, stock: 35 },
          { label: 'Slate Blue', options: { Color: 'Slate Blue' }, price: 129.0, comparePrice: 159.0, stock: 20 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 6 — Micro thu âm condenser USB
  await prisma.product.create({
    data: {
      name: 'Studio USB Condenser Microphone',
      description:
        'Podcast and content creation microphone with built-in cardioid pickup, mute button, and volume dial. Compatible with Mac and Windows via USB.',
      shopId: volt.id,
      categoryId: catAudio.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
      attributes: {
        create: [{ name: 'Finish', options: ['Black', 'Silver'] }],
      },
      variants: {
        create: [
          { label: 'Black', options: { Finish: 'Black' }, price: 89.0, stock: 28, isDefault: true },
          { label: 'Silver', options: { Finish: 'Silver' }, price: 89.0, stock: 24 },
        ],
      },
    },
  });

  // Sản phẩm 7 — Đế sạc MagSafe 3-trong-1
  const magStand = await prisma.product.create({
    data: {
      name: 'MagSafe 3-in-1 Charging Stand',
      description:
        'Simultaneously charge your iPhone, Apple Watch, and AirPods. Made from aircraft-grade aluminum with a weighted anti-slip base. Supports 15W MagSafe fast charging.',
      shopId: volt.id,
      categoryId: catPhoneGear.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600',
      attributes: {
        create: [{ name: 'Finish', options: ['Midnight Black', 'Brushed Silver'] }],
      },
      variants: {
        create: [
          { label: 'Midnight Black', options: { Finish: 'Midnight Black' }, price: 85.0, stock: 30, isDefault: true },
          { label: 'Brushed Silver', options: { Finish: 'Brushed Silver' }, price: 85.0, stock: 22 },
        ],
      },
    },
    include: { variants: true },
  });

  // Sản phẩm 8 — Ốp lưng tương thích MagSafe
  await prisma.product.create({
    data: {
      name: 'MagSafe Compatible Case — iPhone 15 Pro',
      description:
        'Ultra-thin 1.2mm polycarbonate shell with MagSafe alignment ring. Precise cutouts, tactile buttons, and a matte coating that resists fingerprints.',
      shopId: volt.id,
      categoryId: catPhoneGear.id,
      isVisible: true,
      imageUrl:
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
      attributes: {
        create: [
          { name: 'Model', options: ['iPhone 15 Pro', 'iPhone 15 Pro Max'] },
          { name: 'Color', options: ['Clear', 'Midnight', 'Starlight', 'Deep Purple'] },
        ],
      },
      variants: {
        create: [
          { label: '15 Pro / Clear', options: { Model: 'iPhone 15 Pro', Color: 'Clear' }, price: 29.0, stock: 45, isDefault: true },
          { label: '15 Pro / Midnight', options: { Model: 'iPhone 15 Pro', Color: 'Midnight' }, price: 29.0, stock: 38 },
          { label: '15 Pro / Starlight', options: { Model: 'iPhone 15 Pro', Color: 'Starlight' }, price: 29.0, stock: 30 },
          { label: '15 Pro / Deep Purple', options: { Model: 'iPhone 15 Pro', Color: 'Deep Purple' }, price: 29.0, stock: 25 },
          { label: '15 Pro Max / Clear', options: { Model: 'iPhone 15 Pro Max', Color: 'Clear' }, price: 32.0, stock: 40 },
          { label: '15 Pro Max / Midnight', options: { Model: 'iPhone 15 Pro Max', Color: 'Midnight' }, price: 32.0, stock: 35 },
          { label: '15 Pro Max / Starlight', options: { Model: 'iPhone 15 Pro Max', Color: 'Starlight' }, price: 32.0, stock: 28 },
          { label: '15 Pro Max / Deep Purple', options: { Model: 'iPhone 15 Pro Max', Color: 'Deep Purple' }, price: 32.0, stock: 18 },
        ],
      },
    },
  });

  console.log('✅ Created 8 products for Volt Tech');

  // ─── ĐƠN HÀNG — Cửa hàng Lumière ──────────────────────────────────────────────────────
  const linenShirtV = linenShirt.variants.find((v) => v.label === 'M / Sand')!;
  const trousersV   = trousers.variants.find((v) => v.label === 'S / Black')!;
  const toteV       = canvasTote.variants.find((v) => v.label === 'Black')!;
  const sweaterV    = merinoSweater.variants.find((v) => v.label === 'M / Oatmeal')!;
  const trenchV     = trenchCoat.variants.find((v) => v.label === 'M / Sand')!;

  // ORD-2025-001 — ĐÃ GIAO HÀNG (đã thanh toán qua Stripe)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-001',
      buyerName: 'Minh Tú',
      buyerEmail: 'minhtu@gmail.com',
      buyerPhone: '0912 345 678',
      shippingAddress: '88 Lê Lợi',
      shippingCity: 'TP. Hồ Chí Minh',
      shippingDistrict: 'Quận 1',
      subtotal: 148.0,
      shippingFee: 5.0,
      totalAmount: 153.0,
      status: 'DELIVERED',
      deliveredAt: new Date('2025-03-15'),
      shopId: lumiere.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 59.0,
            productName: linenShirt.name,
            productImage: linenShirt.imageUrl,
            variantLabel: linenShirtV.label,
            productId: linenShirt.id,
            variantId: linenShirtV.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 89.0,
            productName: trousers.name,
            productImage: trousers.imageUrl,
            variantLabel: trousersV.label,
            productId: trousers.id,
            variantId: trousersV.id,
          },
        ],
      },
    },
  });

  // ORD-2025-002 — ĐANG GIAO HÀNG (có giảm giá)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-002',
      buyerName: 'Linh Phương',
      buyerEmail: 'linhphuong@yahoo.com',
      buyerPhone: '0987 654 321',
      shippingAddress: '22 Nguyễn Huệ',
      shippingCity: 'Đà Nẵng',
      shippingDistrict: 'Hải Châu',
      subtotal: 78.0,
      shippingFee: 5.0,
      discount: 10.0,
      totalAmount: 73.0,
      status: 'SHIPPING',
      shopId: lumiere.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 78.0,
            productName: canvasTote.name,
            productImage: canvasTote.imageUrl,
            variantLabel: toteV.label,
            productId: canvasTote.id,
            variantId: toteV.id,
          },
        ],
      },
    },
  });

  // ORD-2025-003 — ĐÃ XÁC NHẬN (COD, miễn phí giao hàng)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-003',
      buyerName: 'Huy Hoàng',
      buyerEmail: 'huyhoang@gmail.com',
      buyerPhone: '0934 111 222',
      shippingAddress: '5 Trần Phú',
      shippingCity: 'Hà Nội',
      shippingDistrict: 'Hoàn Kiếm',
      subtotal: 265.0,
      shippingFee: 0.0,
      totalAmount: 265.0,
      status: 'CONFIRMED',
      shopId: lumiere.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 120.0,
            productName: merinoSweater.name,
            productImage: merinoSweater.imageUrl,
            variantLabel: sweaterV.label,
            productId: merinoSweater.id,
            variantId: sweaterV.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 145.0,
            productName: trenchCoat.name,
            productImage: trenchCoat.imageUrl,
            variantLabel: trenchV.label,
            productId: trenchCoat.id,
            variantId: trenchV.id,
          },
        ],
      },
    },
  });

  // ORD-2025-004 — ĐANG CHỜ XÁC NHẬN (COD, có ghi chú)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-004',
      buyerName: 'Thanh Mai',
      buyerEmail: 'thanhmai@outlook.com',
      buyerPhone: '0901 888 777',
      shippingAddress: '17 Bùi Thị Xuân',
      shippingCity: 'TP. Hồ Chí Minh',
      shippingDistrict: 'Quận 3',
      shippingNote: 'Gọi trước khi giao 30 phút',
      subtotal: 59.0,
      shippingFee: 5.0,
      totalAmount: 64.0,
      status: 'PENDING',
      shopId: lumiere.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 59.0,
            productName: linenShirt.name,
            productImage: linenShirt.imageUrl,
            variantLabel: 'L / White',
            productId: linenShirt.id,
          },
        ],
      },
    },
  });

  // ORD-2025-005 — ĐÃ HỦY (đã hoàn tiền)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-005',
      buyerName: 'Quốc Bảo',
      buyerEmail: 'quocbao@gmail.com',
      buyerPhone: '0945 222 333',
      shippingAddress: '30 Lý Tự Trọng',
      shippingCity: 'Cần Thơ',
      subtotal: 89.0,
      shippingFee: 8.0,
      totalAmount: 97.0,
      status: 'CANCELLED',
      shopId: lumiere.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 89.0,
            productName: trousers.name,
            productImage: trousers.imageUrl,
            variantLabel: 'M / Cream',
            productId: trousers.id,
          },
        ],
      },
    },
  });

  // ORD-2025-006 — ĐANG XỬ LÝ
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-006',
      buyerName: 'Ngọc Anh',
      buyerEmail: 'ngocanh@gmail.com',
      buyerPhone: '0976 555 111',
      shippingAddress: '9 Pasteur',
      shippingCity: 'TP. Hồ Chí Minh',
      shippingDistrict: 'Quận 1',
      subtotal: 265.0,
      shippingFee: 0.0,
      totalAmount: 265.0,
      status: 'PROCESSING',
      shopId: lumiere.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 120.0,
            productName: merinoSweater.name,
            productImage: merinoSweater.imageUrl,
            variantLabel: 'S / Dusty Rose',
            productId: merinoSweater.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 145.0,
            productName: trenchCoat.name,
            productImage: trenchCoat.imageUrl,
            variantLabel: 'L / Sand',
            productId: trenchCoat.id,
          },
        ],
      },
    },
  });

  console.log('✅ Created 6 orders for Lumière');

  // ─── ĐƠN HÀNG — Cửa hàng Volt Tech ────────────────────────────────────────────────────
  const hubV     = usbHub.variants.find((v) => v.label === 'Space Grey')!;
  const matV     = deskMat.variants.find((v) => v.label === 'Black')!;
  const cableV   = braidedCable.variants.find((v) => v.label === '2m / Black')!;
  const chargerV = ganCharger.variants.find((v) => v.label === '2×USB-C')!;
  const earbudsV = probuds.variants.find((v) => v.label === 'Obsidian')!;
  const standV   = magStand.variants.find((v) => v.label === 'Midnight Black')!;

  // ORD-2025-007 — ĐÃ GIAO HÀNG (giỏ hàng lớn)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-007',
      buyerName: 'Đức Minh',
      buyerEmail: 'ducminh@gmail.com',
      buyerPhone: '0968 100 200',
      shippingAddress: '15 Cầu Giấy',
      shippingCity: 'Hà Nội',
      shippingDistrict: 'Cầu Giấy',
      subtotal: 232.0,
      shippingFee: 0.0,
      totalAmount: 232.0,
      status: 'DELIVERED',
      deliveredAt: new Date('2025-04-02'),
      shopId: volt.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 129.0,
            productName: probuds.name,
            productImage: probuds.imageUrl,
            variantLabel: earbudsV.label,
            productId: probuds.id,
            variantId: earbudsV.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 85.0,
            productName: magStand.name,
            productImage: magStand.imageUrl,
            variantLabel: standV.label,
            productId: magStand.id,
            variantId: standV.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 18.0,
            productName: braidedCable.name,
            productImage: braidedCable.imageUrl,
            variantLabel: '1m / White',
            productId: braidedCable.id,
          },
        ],
      },
    },
  });

  // ORD-008 — ĐÃ GIAO HÀNG (COD)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-008',
      buyerName: 'Thu Hà',
      buyerEmail: 'thuha@hotmail.com',
      buyerPhone: '0912 777 888',
      shippingAddress: '66 Đinh Tiên Hoàng',
      shippingCity: 'Hà Nội',
      shippingDistrict: 'Hoàn Kiếm',
      subtotal: 104.99,
      shippingFee: 5.0,
      totalAmount: 109.99,
      status: 'DELIVERED',
      deliveredAt: new Date('2025-04-10'),
      shopId: volt.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 49.99,
            productName: usbHub.name,
            productImage: usbHub.imageUrl,
            variantLabel: hubV.label,
            productId: usbHub.id,
            variantId: hubV.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 55.0,
            productName: deskMat.name,
            productImage: deskMat.imageUrl,
            variantLabel: matV.label,
            productId: deskMat.id,
            variantId: matV.id,
          },
        ],
      },
    },
  });

  // ORD-009 — ĐANG GIAO HÀNG (cáp số lượng nhiều)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-009',
      buyerName: 'Phúc Long',
      buyerEmail: 'phuclong@gmail.com',
      buyerPhone: '0935 444 555',
      shippingAddress: '100 Nam Kỳ Khởi Nghĩa',
      shippingCity: 'TP. Hồ Chí Minh',
      shippingDistrict: 'Quận 3',
      subtotal: 93.0,
      shippingFee: 5.0,
      totalAmount: 98.0,
      status: 'SHIPPING',
      shopId: volt.id,
      items: {
        create: [
          {
            quantity: 2,
            priceAtPurchase: 22.0,
            productName: braidedCable.name,
            productImage: braidedCable.imageUrl,
            variantLabel: cableV.label,
            productId: braidedCable.id,
            variantId: cableV.id,
          },
          {
            quantity: 1,
            priceAtPurchase: 49.0,
            productName: ganCharger.name,
            productImage: ganCharger.imageUrl,
            variantLabel: chargerV.label,
            productId: ganCharger.id,
            variantId: chargerV.id,
          },
        ],
      },
    },
  });

  // ORD-010 — ĐANG CHỜ XÁC NHẬN (COD)
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-010',
      buyerName: 'Bảo Châu',
      buyerEmail: 'baochau@gmail.com',
      buyerPhone: '0978 333 444',
      shippingAddress: '3 Hoàng Diệu',
      shippingCity: 'Đà Nẵng',
      subtotal: 49.99,
      shippingFee: 5.0,
      totalAmount: 54.99,
      status: 'PENDING',
      shopId: volt.id,
      items: {
        create: [
          {
            quantity: 1,
            priceAtPurchase: 49.99,
            productName: usbHub.name,
            productImage: usbHub.imageUrl,
            variantLabel: 'Silver',
            productId: usbHub.id,
          },
        ],
      },
    },
  });

  console.log('✅ Created 4 orders for Volt Tech');

  // ─── ĐÁNH GIÁ — Cửa hàng Lumière ─────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment:
          'Áo chất linen cực kỳ mát, mặc cả ngày không bí. Màu Sand đẹp hơn ảnh nhiều. Sẽ mua thêm size khác!',
        buyerName: 'Minh Tú',
        buyerEmail: 'minhtu@gmail.com',
        isVerified: true,
        status: 'APPROVED',
        sellerReply:
          'Cảm ơn bạn rất nhiều! Chúng mình rất vui khi bạn yêu thích chiếc áo. Hẹn gặp lại bạn nhé 🌿',
        shopId: lumiere.id,
        productId: linenShirt.id,
      },
      {
        rating: 4,
        comment:
          'Quần dáng đẹp, vải tốt nhưng size hơi lớn hơn bình thường một chút, nên order nhỏ hơn một size.',
        buyerName: 'Linh Phương',
        buyerEmail: 'linhphuong@yahoo.com',
        isVerified: true,
        status: 'APPROVED',
        sellerReply:
          'Cảm ơn góp ý của bạn! Mình đã cập nhật bảng size chi tiết hơn ở trang sản phẩm để khách hàng dễ chọn hơn nhé.',
        shopId: lumiere.id,
        productId: trousers.id,
      },
      {
        rating: 5,
        comment:
          'Túi đẹp, vải dày dặn, khoá zip chắc chắn. Mua về dùng đi làm hàng ngày rất tiện. Đóng gói cẩn thận, giao hàng nhanh!',
        buyerName: 'Ngọc Anh',
        buyerEmail: 'ngocanh@gmail.com',
        isVerified: false,
        status: 'APPROVED',
        shopId: lumiere.id,
        productId: canvasTote.id,
      },
      {
        rating: 5,
        comment:
          'Áo len mịn như mơ, mặc vào ấm áp mà không bị ngứa chút nào. Màu Dusty Rose đẹp quá trời! Cực kỳ xứng đáng với giá tiền.',
        buyerName: 'Thu Uyên',
        buyerEmail: 'thuuyen@gmail.com',
        isVerified: false,
        status: 'APPROVED',
        shopId: lumiere.id,
        productId: merinoSweater.id,
      },
      {
        rating: 4,
        comment:
          'Áo khoác nhẹ, may đẹp. Mình hay bị lạnh nên thích kiểu dáng này lắm. Chỉ tiếc là không có size XL.',
        buyerName: 'Huy Hoàng',
        buyerEmail: 'huyhoang@gmail.com',
        isVerified: true,
        status: 'APPROVED',
        sellerReply:
          'Cảm ơn bạn đã phản hồi! Chúng mình đang cân nhắc mở rộng size range cho mùa tới, mong bạn tiếp tục ủng hộ nhé 🙏',
        shopId: lumiere.id,
        productId: trenchCoat.id,
      },
      {
        rating: 3,
        comment: 'Áo ok nhưng màu thực tế nhạt hơn ảnh một chút. Chất linen vẫn tốt.',
        buyerName: 'Kim Ngân',
        buyerEmail: 'kimngan@gmail.com',
        isVerified: false,
        status: 'PENDING',
        shopId: lumiere.id,
        productId: linenShirt.id,
      },
    ],
  });

  console.log('✅ Created 6 reviews for Lumière');

  // ─── ĐÁNH GIÁ — Cửa hàng Volt Tech ───────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        comment:
          'ProBuds X chống ồn cực tốt, dùng trên máy bay thấy rõ sự khác biệt. Pin trâu, đeo cả ngày không đau tai. Recommend 100%!',
        buyerName: 'Đức Minh',
        buyerEmail: 'ducminh@gmail.com',
        isVerified: true,
        status: 'APPROVED',
        sellerReply:
          'Cảm ơn bạn đã review chi tiết! Rất vui khi ProBuds X đồng hành cùng bạn trên mọi chuyến đi ✈️',
        shopId: volt.id,
        productId: probuds.id,
      },
      {
        rating: 5,
        comment:
          'Hub tốt, cắm vào MacBook nhận ngay 4K HDMI không delay. Nhỏ gọn bỏ túi dễ mang đi. Giá hợp lý so với chất lượng.',
        buyerName: 'Thu Hà',
        buyerEmail: 'thuha@hotmail.com',
        isVerified: true,
        status: 'APPROVED',
        shopId: volt.id,
        productId: usbHub.id,
      },
      {
        rating: 4,
        comment:
          'Desk mat trải bàn trông sang hẳn, bề mặt smooth chuột di tốt. Nhược điểm nhỏ là góc cạnh hơi nhọn, cần bo tròn hơn.',
        buyerName: 'Văn Khoa',
        buyerEmail: 'vankhoa@gmail.com',
        isVerified: false,
        status: 'APPROVED',
        sellerReply:
          'Cảm ơn góp ý! Chúng mình sẽ chú ý cải thiện phần hoàn thiện cạnh viền ở lô hàng tiếp theo bạn nhé.',
        shopId: volt.id,
        productId: deskMat.id,
      },
      {
        rating: 5,
        comment:
          'Cáp sạc nhanh thật sự, sạc laptop 65W ngon lành. Dây bọc nylon chắc chắn, uốn thấy bền hơn cáp Apple gốc nhiều lần.',
        buyerName: 'Phúc Long',
        buyerEmail: 'phuclong@gmail.com',
        isVerified: true,
        status: 'APPROVED',
        shopId: volt.id,
        productId: braidedCable.id,
      },
      {
        rating: 5,
        comment:
          'Sạc 3-in-1 rất tiện, để đầu giường sạc iPhone + Watch + AirPods một lúc. Build quality nhôm cứng cáp, không bị nóng.',
        buyerName: 'An Nhiên',
        buyerEmail: 'annhien@gmail.com',
        isVerified: false,
        status: 'APPROVED',
        sellerReply:
          'Cảm ơn bạn! Thiết kế nhôm nguyên khối đúng là điểm mình tự hào nhất ở sản phẩm này 🙌',
        shopId: volt.id,
        productId: magStand.id,
      },
      {
        rating: 2,
        comment:
          'Sạc GaN bị nóng hơn mong đợi khi sạc đồng thời cả 2 cổng. Chờ xem có bản cải thiện không.',
        buyerName: 'Minh Khoa',
        buyerEmail: 'minhkhoa@gmail.com',
        isVerified: false,
        status: 'PENDING',
        shopId: volt.id,
        productId: ganCharger.id,
      },
    ],
  });

  console.log('✅ Created 6 reviews for Volt Tech');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Demo accounts (password: password123):');
  console.log('   alice@lumiere.store  →  /shop/lumiere');
  console.log('   ben@volttech.shop    →  /shop/volttech\n');
  console.log(
    '📦 Orders: 10 total  (PENDING ×2 · CONFIRMED ×1 · PROCESSING ×1 · SHIPPING ×2 · DELIVERED ×3 · CANCELLED ×1)',
  );
  console.log('⭐ Reviews: 12 total  (APPROVED ×10 · PENDING ×2)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
