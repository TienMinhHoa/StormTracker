/**
 * Default placeholder image for news thumbnails
 */
export const DEFAULT_NEWS_IMAGE = 'https://cdnphoto.dantri.com.vn/V0A7pXa4T8wsbhHMmWmZti84Kkk=/2025/11/07/da-nang-1762483851451.jpg';

/**
 * Get a safe image URL with fallback to default
 */
export function getSafeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return DEFAULT_NEWS_IMAGE;
  }
  return imageUrl;
}

/**
 * Handle image load error and replace with default
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement | HTMLDivElement, Event>, fallbackUrl?: string) {
  const target = event.currentTarget;
  
  if (target instanceof HTMLImageElement) {
    target.src = fallbackUrl || DEFAULT_NEWS_IMAGE;
  } else if (target instanceof HTMLDivElement) {
    // For div with backgroundImage
    target.style.backgroundImage = `url(${fallbackUrl || DEFAULT_NEWS_IMAGE})`;
  }
}

