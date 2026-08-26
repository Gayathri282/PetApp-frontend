/**
 * Media URL resolution and normalization helper.
 * Standardizes media extraction across all product cards, reel carousels, modals, and fullscreen players.
 */

/**
 * Resolves full media URL given a relative or absolute path.
 */
export const getFullSrc = (url) => {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.replace(/\\/g, '/');
  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('data:')
  ) {
    return cleanUrl;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
};

/**
 * Extracts and normalizes a playable video URL from any item object or string.
 * Works seamlessly across products, reels, nested primaryReel, media arrays, video objects, etc.
 */
export const getPlayableVideoUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return getFullSrc(item);

  const subReel = item.primaryReel || (Array.isArray(item.reels) && item.reels.length > 0 ? item.reels[0] : null);

  const candidates = [
    // SubReel properties
    subReel?.videoUrl,
    subReel?.video_url,
    subReel?.mediaUrl,
    subReel?.media_url,
    subReel?.url,
    subReel?.src,
    typeof subReel?.video === 'string' ? subReel.video : subReel?.video?.url || subReel?.video?.videoUrl,
    Array.isArray(subReel?.media)
      ? subReel.media[0]?.url || subReel.media[0]?.videoUrl || subReel.media[0]
      : typeof subReel?.media === 'string'
      ? subReel.media
      : subReel?.media?.url,
    typeof subReel === 'string' ? subReel : null,

    // Direct item properties
    item.videoUrl,
    item.video_url,
    item.mediaUrl,
    item.media_url,
    item.url,
    item.src,
    typeof item.video === 'string' ? item.video : item.video?.url || item.video?.videoUrl,
    Array.isArray(item.media)
      ? item.media[0]?.url || item.media[0]?.videoUrl || item.media[0]
      : typeof item.media === 'string'
      ? item.media
      : item.media?.url,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim() !== '') {
      return getFullSrc(candidate);
    }
  }

  return '';
};

/**
 * Extracts poster/thumbnail URL from item.
 */
export const getPosterUrl = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return getFullSrc(item);

  const subReel = item.primaryReel || (Array.isArray(item.reels) && item.reels.length > 0 ? item.reels[0] : null);

  const candidates = [
    subReel?.thumbnail,
    subReel?.poster,
    subReel?.image,
    item.thumbnail,
    item.poster,
    Array.isArray(item.images) ? item.images[0] : item.image,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim() !== '') {
      return getFullSrc(candidate);
    }
  }

  return '';
};

/**
 * Normalizes item data into a consistent video object layer:
 * { id, url, thumbnail, name, raw }
 */
export const normalizeMediaItem = (item) => {
  if (!item) return { id: '', url: '', thumbnail: '', name: '', raw: null };
  const id = item._id || item.id || `media-${Math.random()}`;
  const url = getPlayableVideoUrl(item);
  const thumbnail = getPosterUrl(item);
  return {
    id: String(id),
    url,
    thumbnail,
    name: item.name || item.title || item.caption || 'Pet Listing',
    raw: item,
  };
};

/**
 * Diagnostic logger for video items & URLs
 */
export const logVideoDiagnostics = (sectionName, item) => {
  if (!item) return;
  const norm = normalizeMediaItem(item);
  console.log(`[VIDEO DIAGNOSTIC - ${sectionName.toUpperCase()}] ITEM:`, item);
  console.log(`[VIDEO DIAGNOSTIC - ${sectionName.toUpperCase()}] NORMALIZED VIDEO:`, norm);
  console.table({
    section: sectionName,
    id: norm.id,
    title: norm.name,
    videoUrl: norm.url,
    hasVideoUrl: !!norm.url,
    videoType: typeof norm.url,
  });
};
