// Ảnh shop (banner/logo) chỉ nhận link do chính API upload lên Cloudinary của MarketUp:
// link ngoài có thể chết, bị đổi nội dung, hoặc dùng để theo dõi người xem storefront.
export function isOwnCloudinaryImage(
  url: string,
  cloudName: string | undefined,
): boolean {
  if (!cloudName) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === 'https:' &&
    parsed.hostname === 'res.cloudinary.com' &&
    parsed.pathname.startsWith(`/${cloudName}/image/upload/`) &&
    !parsed.username &&
    !parsed.password
  );
}
