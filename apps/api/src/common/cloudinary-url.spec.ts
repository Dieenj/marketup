import { isOwnCloudinaryImage } from './cloudinary-url';

describe('isOwnCloudinaryImage', () => {
  const cloud = 'marketup-prod';

  it('accepts images uploaded to our cloud', () => {
    expect(
      isOwnCloudinaryImage(
        'https://res.cloudinary.com/marketup-prod/image/upload/v1712/marketup/banner.webp',
        cloud,
      ),
    ).toBe(true);
  });

  it.each([
    [
      'another cloud',
      'https://res.cloudinary.com/someone-else/image/upload/x.png',
    ],
    [
      'plain http',
      'http://res.cloudinary.com/marketup-prod/image/upload/x.png',
    ],
    [
      'lookalike host',
      'https://res.cloudinary.com.evil.test/marketup-prod/image/upload/x.png',
    ],
    [
      'credentials trick',
      'https://res.cloudinary.com@evil.test/marketup-prod/image/upload/x.png',
    ],
    [
      'cloud name prefix',
      'https://res.cloudinary.com/marketup-prod-2/image/upload/x.png',
    ],
    [
      'video upload',
      'https://res.cloudinary.com/marketup-prod/video/upload/x.mp4',
    ],
    ['external host', 'https://images.unsplash.com/photo-1'],
    ['not a URL', 'banner.png'],
  ])('rejects %s', (_, url) => {
    expect(isOwnCloudinaryImage(url, cloud)).toBe(false);
  });

  it('rejects everything when Cloudinary is not configured', () => {
    expect(
      isOwnCloudinaryImage(
        'https://res.cloudinary.com/marketup-prod/image/upload/x.png',
        undefined,
      ),
    ).toBe(false);
  });
});
