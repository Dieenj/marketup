import type { Metadata } from 'next';

// Metadata chia sẻ (Open Graph + Twitter card) cho trang shop và trang sản phẩm
export function shareMetadata({
  title,
  description,
  url,
  image,
}: {
  title: string;
  description?: string;
  url: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      ...(image && { images: [{ url: image }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}
