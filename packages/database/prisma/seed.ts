import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── SHOP 1: LUMIÈRE — Fashion Boutique ───────────────────────────────────
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
      description: 'Curated fashion essentials for the modern wardrobe. Minimal, timeless, effortless.',
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

  // Product 1 — Linen Shirt
  await prisma.product.create({
    data: {
      name: 'Linen Relaxed Shirt',
      description: 'Breathable 100% linen shirt with a relaxed silhouette. Perfect for warm-weather dressing — pair with trousers or wear open over a tee.',
      shopId: lumiere.id,
      categoryId: catApparel.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600',
      attributes: { create: [
        { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
        { name: 'Color', options: ['Sand', 'Slate', 'White'] },
      ]},
      variants: { create: [
        { label: 'S / Sand', options: { Size: 'S', Color: 'Sand' }, price: 59.00, stock: 12 },
        { label: 'M / Sand', options: { Size: 'M', Color: 'Sand' }, price: 59.00, stock: 18 },
        { label: 'L / Sand', options: { Size: 'L', Color: 'Sand' }, price: 59.00, stock: 10 },
        { label: 'S / Slate', options: { Size: 'S', Color: 'Slate' }, price: 59.00, stock: 8 },
        { label: 'M / Slate', options: { Size: 'M', Color: 'Slate' }, price: 59.00, stock: 14 },
        { label: 'L / Slate', options: { Size: 'L', Color: 'Slate' }, price: 59.00, stock: 6 },
        { label: 'S / White', options: { Size: 'S', Color: 'White' }, price: 59.00, stock: 15 },
        { label: 'M / White', options: { Size: 'M', Color: 'White' }, price: 59.00, stock: 20 },
        { label: 'L / White', options: { Size: 'L', Color: 'White' }, price: 59.00, stock: 9 },
        { label: 'XL / White', options: { Size: 'XL', Color: 'White' }, price: 59.00, stock: 4 },
      ]},
    },
  });

  // Product 2 — Wide-Leg Trousers
  await prisma.product.create({
    data: {
      name: 'High-Rise Wide-Leg Trousers',
      description: 'Tailored wide-leg trousers with a high rise and clean front crease. Cut from a structured fabric blend that drapes beautifully.',
      shopId: lumiere.id,
      categoryId: catApparel.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
      attributes: { create: [
        { name: 'Size', options: ['XS', 'S', 'M', 'L'] },
        { name: 'Color', options: ['Black', 'Cream', 'Mocha'] },
      ]},
      variants: { create: [
        { label: 'XS / Black', options: { Size: 'XS', Color: 'Black' }, price: 89.00, stock: 6 },
        { label: 'S / Black', options: { Size: 'S', Color: 'Black' }, price: 89.00, stock: 14 },
        { label: 'M / Black', options: { Size: 'M', Color: 'Black' }, price: 89.00, stock: 18 },
        { label: 'L / Black', options: { Size: 'L', Color: 'Black' }, price: 89.00, stock: 8 },
        { label: 'S / Cream', options: { Size: 'S', Color: 'Cream' }, price: 89.00, stock: 10 },
        { label: 'M / Cream', options: { Size: 'M', Color: 'Cream' }, price: 89.00, stock: 12 },
        { label: 'S / Mocha', options: { Size: 'S', Color: 'Mocha' }, price: 89.00, stock: 5 },
        { label: 'M / Mocha', options: { Size: 'M', Color: 'Mocha' }, price: 89.00, stock: 7 },
      ]},
    },
  });

  // Product 3 — Silk Scarf
  await prisma.product.create({
    data: {
      name: 'Silk Twill Scarf',
      description: 'A 90×90 cm silk twill scarf featuring an abstract floral print. Wear it tied at the neck, in your hair, or on a bag handle.',
      shopId: lumiere.id,
      categoryId: catAccessories.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600',
      attributes: { create: [
        { name: 'Print', options: ['Floral Black', 'Floral Ivory', 'Geometric Blue'] },
      ]},
      variants: { create: [
        { label: 'Floral Black', options: { Print: 'Floral Black' }, price: 45.00, stock: 20 },
        { label: 'Floral Ivory', options: { Print: 'Floral Ivory' }, price: 45.00, stock: 15 },
        { label: 'Geometric Blue', options: { Print: 'Geometric Blue' }, price: 45.00, stock: 8 },
      ]},
    },
  });

  // Product 4 — Leather Wrap Belt
  await prisma.product.create({
    data: {
      name: 'Leather Wrap Belt',
      description: 'Hand-finished vegetable-tanned leather belt with a minimalist buckle. Complements dresses, blouses, and tailored trousers.',
      shopId: lumiere.id,
      categoryId: catAccessories.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
      attributes: { create: [
        { name: 'Color', options: ['Tan', 'Black'] },
        { name: 'Length', options: ['S', 'M', 'L'] },
      ]},
      variants: { create: [
        { label: 'Tan / S', options: { Color: 'Tan', Length: 'S' }, price: 38.00, stock: 18 },
        { label: 'Tan / M', options: { Color: 'Tan', Length: 'M' }, price: 38.00, stock: 22 },
        { label: 'Black / M', options: { Color: 'Black', Length: 'M' }, price: 38.00, stock: 16 },
        { label: 'Black / L', options: { Color: 'Black', Length: 'L' }, price: 38.00, stock: 12 },
      ]},
    },
  });

  // Product 5 — Canvas Tote
  await prisma.product.create({
    data: {
      name: 'Canvas Structured Tote',
      description: 'A roomy, structured tote crafted from heavyweight washed canvas. Features a zip closure, interior pocket, and reinforced handles.',
      shopId: lumiere.id,
      categoryId: catBags.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
      attributes: { create: [
        { name: 'Color', options: ['Natural', 'Black', 'Forest Green'] },
      ]},
      variants: { create: [
        { label: 'Natural', options: { Color: 'Natural' }, price: 78.00, stock: 25 },
        { label: 'Black', options: { Color: 'Black' }, price: 78.00, stock: 30 },
        { label: 'Forest Green', options: { Color: 'Forest Green' }, price: 78.00, stock: 12 },
      ]},
    },
  });

  // Product 6 — Mini Shoulder Bag
  await prisma.product.create({
    data: {
      name: 'Mini Shoulder Bag',
      description: 'Compact leather shoulder bag with a removable strap and polished brass hardware. Ideal for city days and evening occasions.',
      shopId: lumiere.id,
      categoryId: catBags.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1512641407323-51c321a29aaa?w=600',
      attributes: { create: [
        { name: 'Color', options: ['Cream', 'Black'] },
      ]},
      variants: { create: [
        { label: 'Cream', options: { Color: 'Cream' }, price: 69.00, stock: 14 },
        { label: 'Black', options: { Color: 'Black' }, price: 69.00, stock: 18 },
      ]},
    },
  });

  // Product 7 — Merino Knit Sweater
  await prisma.product.create({
    data: {
      name: 'Fine Merino Knit Sweater',
      description: 'Ultra-soft 100% merino wool knit in a relaxed fit. Naturally temperature-regulating — light enough for layering, warm enough to stand alone.',
      shopId: lumiere.id,
      categoryId: catOuterwear.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600',
      attributes: { create: [
        { name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] },
        { name: 'Color', options: ['Oatmeal', 'Charcoal', 'Dusty Rose'] },
      ]},
      variants: { create: [
        { label: 'S / Oatmeal', options: { Size: 'S', Color: 'Oatmeal' }, price: 120.00, stock: 10 },
        { label: 'M / Oatmeal', options: { Size: 'M', Color: 'Oatmeal' }, price: 120.00, stock: 14 },
        { label: 'L / Oatmeal', options: { Size: 'L', Color: 'Oatmeal' }, price: 120.00, stock: 8 },
        { label: 'S / Charcoal', options: { Size: 'S', Color: 'Charcoal' }, price: 120.00, stock: 12 },
        { label: 'M / Charcoal', options: { Size: 'M', Color: 'Charcoal' }, price: 120.00, stock: 16 },
        { label: 'L / Charcoal', options: { Size: 'L', Color: 'Charcoal' }, price: 120.00, stock: 6 },
        { label: 'S / Dusty Rose', options: { Size: 'S', Color: 'Dusty Rose' }, price: 120.00, stock: 7 },
        { label: 'M / Dusty Rose', options: { Size: 'M', Color: 'Dusty Rose' }, price: 120.00, stock: 9 },
      ]},
    },
  });

  // Product 8 — Lightweight Trench Coat
  await prisma.product.create({
    data: {
      name: 'Lightweight Trench Coat',
      description: 'Water-resistant trench with a removable belt and subtle shoulder epaulets. Designed for easy layering from spring to autumn.',
      shopId: lumiere.id,
      categoryId: catOuterwear.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1520962915122-8bcbf628a0f0?w=600',
      attributes: { create: [
        { name: 'Size', options: ['S', 'M', 'L'] },
        { name: 'Color', options: ['Sand', 'Olive'] },
      ]},
      variants: { create: [
        { label: 'S / Sand', options: { Size: 'S', Color: 'Sand' }, price: 145.00, stock: 10 },
        { label: 'M / Sand', options: { Size: 'M', Color: 'Sand' }, price: 145.00, stock: 12 },
        { label: 'L / Sand', options: { Size: 'L', Color: 'Sand' }, price: 145.00, stock: 8 },
        { label: 'S / Olive', options: { Size: 'S', Color: 'Olive' }, price: 145.00, stock: 9 },
        { label: 'M / Olive', options: { Size: 'M', Color: 'Olive' }, price: 145.00, stock: 11 },
      ]},
    },
  });

  console.log('✅ Created 8 products for Lumière');

  // ─── SHOP 2: VOLT TECH — Tech Accessories ────────────────────────────────
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
      description: 'Premium tech accessories for creators and professionals. Charge faster, work smarter, look better.',
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

  // Product 1 — USB-C Hub
  await prisma.product.create({
    data: {
      name: '7-in-1 USB-C Hub',
      description: 'Expand your laptop\'s connectivity with 4K HDMI, 2× USB-A 3.0, USB-C PD 100W passthrough, SD, microSD, and 3.5mm audio jack. Plug-and-play, no drivers needed.',
      shopId: volt.id,
      categoryId: catDesk.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
      attributes: { create: [
        { name: 'Color', options: ['Space Grey', 'Silver'] },
      ]},
      variants: { create: [
        { label: 'Space Grey', options: { Color: 'Space Grey' }, price: 49.99, stock: 50 },
        { label: 'Silver', options: { Color: 'Silver' }, price: 49.99, stock: 35 },
      ]},
    },
  });

  // Product 2 — XL Desk Mat
  await prisma.product.create({
    data: {
      name: 'XL Leather Desk Mat',
      description: 'Full-grain PU leather surface with a micro-textured finish for smooth mouse glide. Non-slip rubber base, stitched edges. 90×40 cm.',
      shopId: volt.id,
      categoryId: catDesk.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1587202372583-49330a15584d?w=600',
      attributes: { create: [
        { name: 'Color', options: ['Black', 'Dark Brown', 'Tan'] },
      ]},
      variants: { create: [
        { label: 'Black', options: { Color: 'Black' }, price: 55.00, stock: 60 },
        { label: 'Dark Brown', options: { Color: 'Dark Brown' }, price: 55.00, stock: 45 },
        { label: 'Tan', options: { Color: 'Tan' }, price: 55.00, stock: 30 },
      ]},
    },
  });

  // Product 3 — Braided Cable
  await prisma.product.create({
    data: {
      name: 'USB-C to USB-C Braided Cable',
      description: '240W fast-charge rated, 480 Mbps data transfer. Nylon-braided outer sleeve with reinforced connectors rated for 30,000+ bends. Available in 1m and 2m lengths.',
      shopId: volt.id,
      categoryId: catCables.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1583394293214-5de0b5c28ba5?w=600',
      attributes: { create: [
        { name: 'Length', options: ['1m', '2m'] },
        { name: 'Color', options: ['Black', 'White', 'Sage'] },
      ]},
      variants: { create: [
        { label: '1m / Black', options: { Length: '1m', Color: 'Black' }, price: 18.00, stock: 80 },
        { label: '1m / White', options: { Length: '1m', Color: 'White' }, price: 18.00, stock: 65 },
        { label: '1m / Sage', options: { Length: '1m', Color: 'Sage' }, price: 18.00, stock: 40 },
        { label: '2m / Black', options: { Length: '2m', Color: 'Black' }, price: 22.00, stock: 60 },
        { label: '2m / White', options: { Length: '2m', Color: 'White' }, price: 22.00, stock: 50 },
        { label: '2m / Sage', options: { Length: '2m', Color: 'Sage' }, price: 22.00, stock: 28 },
      ]},
    },
  });

  // Product 4 — 65W GaN Charger
  await prisma.product.create({
    data: {
      name: '65W GaN Fast Charger',
      description: 'Compact GaN wall charger with dual USB-C ports and 65W total power delivery. Ideal for laptops, tablets, and phones while saving desk space.',
      shopId: volt.id,
      categoryId: catCables.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1581291519195-ef11498d1cf5?w=600',
      attributes: { create: [
        { name: 'Port', options: ['1×USB-C', '2×USB-C'] },
      ]},
      variants: { create: [
        { label: '1×USB-C', options: { Port: '1×USB-C' }, price: 39.00, stock: 55 },
        { label: '2×USB-C', options: { Port: '2×USB-C' }, price: 49.00, stock: 32 },
      ]},
    },
  });

  // Product 5 — ProBuds X Wireless Earbuds
  await prisma.product.create({
    data: {
      name: 'ProBuds X Active Noise Cancelling',
      description: 'Up to 32 hours total battery (8hr buds + 24hr case), ANC with transparency mode, IPX5 water resistance, and multipoint connection for 2 devices simultaneously.',
      shopId: volt.id,
      categoryId: catAudio.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600',
      attributes: { create: [
        { name: 'Color', options: ['Obsidian', 'Pearl White', 'Slate Blue'] },
      ]},
      variants: { create: [
        { label: 'Obsidian', options: { Color: 'Obsidian' }, price: 129.00, stock: 40 },
        { label: 'Pearl White', options: { Color: 'Pearl White' }, price: 129.00, stock: 35 },
        { label: 'Slate Blue', options: { Color: 'Slate Blue' }, price: 129.00, stock: 20 },
      ]},
    },
  });

  // Product 6 — USB Condenser Microphone
  await prisma.product.create({
    data: {
      name: 'Studio USB Condenser Microphone',
      description: 'Podcast and content creation microphone with built-in cardioid pickup, mute button, and volume dial. Compatible with Mac and Windows via USB. ',
      shopId: volt.id,
      categoryId: catAudio.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
      attributes: { create: [
        { name: 'Finish', options: ['Black', 'Silver'] },
      ]},
      variants: { create: [
        { label: 'Black', options: { Finish: 'Black' }, price: 89.00, stock: 28 },
        { label: 'Silver', options: { Finish: 'Silver' }, price: 89.00, stock: 24 },
      ]},
    },
  });

  // Product 7 — MagSafe 3-in-1 Charging Stand
  await prisma.product.create({
    data: {
      name: 'MagSafe 3-in-1 Charging Stand',
      description: 'Simultaneously charge your iPhone, Apple Watch, and AirPods. Made from aircraft-grade aluminum with a weighted anti-slip base. Supports 15W MagSafe fast charging.',
      shopId: volt.id,
      categoryId: catPhoneGear.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600',
      attributes: { create: [
        { name: 'Finish', options: ['Midnight Black', 'Brushed Silver'] },
      ]},
      variants: { create: [
        { label: 'Midnight Black', options: { Finish: 'Midnight Black' }, price: 85.00, stock: 30 },
        { label: 'Brushed Silver', options: { Finish: 'Brushed Silver' }, price: 85.00, stock: 22 },
      ]},
    },
  });

  // Product 8 — MagSafe Compatible Case
  await prisma.product.create({
    data: {
      name: 'MagSafe Compatible Case — iPhone 15 Pro',
      description: 'Ultra-thin 1.2mm polycarbonate shell with MagSafe alignment ring. Precise cutouts, tactile buttons, and a matte coating that resists fingerprints.',
      shopId: volt.id,
      categoryId: catPhoneGear.id,
      isVisible: true,
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
      attributes: { create: [
        { name: 'Model', options: ['iPhone 15 Pro', 'iPhone 15 Pro Max'] },
        { name: 'Color', options: ['Clear', 'Midnight', 'Starlight', 'Deep Purple'] },
      ]},
      variants: { create: [
        { label: '15 Pro / Clear', options: { Model: 'iPhone 15 Pro', Color: 'Clear' }, price: 29.00, stock: 45 },
        { label: '15 Pro / Midnight', options: { Model: 'iPhone 15 Pro', Color: 'Midnight' }, price: 29.00, stock: 38 },
        { label: '15 Pro / Starlight', options: { Model: 'iPhone 15 Pro', Color: 'Starlight' }, price: 29.00, stock: 30 },
        { label: '15 Pro / Deep Purple', options: { Model: 'iPhone 15 Pro', Color: 'Deep Purple' }, price: 29.00, stock: 25 },
        { label: '15 Pro Max / Clear', options: { Model: 'iPhone 15 Pro Max', Color: 'Clear' }, price: 32.00, stock: 40 },
        { label: '15 Pro Max / Midnight', options: { Model: 'iPhone 15 Pro Max', Color: 'Midnight' }, price: 32.00, stock: 35 },
        { label: '15 Pro Max / Starlight', options: { Model: 'iPhone 15 Pro Max', Color: 'Starlight' }, price: 32.00, stock: 28 },
        { label: '15 Pro Max / Deep Purple', options: { Model: 'iPhone 15 Pro Max', Color: 'Deep Purple' }, price: 32.00, stock: 18 },
      ]},
    },
  });

  console.log('✅ Created 8 products for Volt Tech');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Demo accounts (password: password123):');
  console.log('   alice@lumiere.store  →  /shop/lumiere');
  console.log('   ben@volttech.shop    →  /shop/volttech\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
