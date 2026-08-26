/**
 * Unified Reusable Reel / Product Navigation Helper
 * Standardizes navigation across Feed, Search, Chat, and Notifications.
 */
export const openReel = (navigate, item, options = {}) => {
  if (!item) {
    console.error('[OPEN REEL] Cannot navigate: item is null or undefined');
    return;
  }

  const id = item._id || item.id || item.productId;
  if (!id) {
    console.error('[OPEN REEL] Cannot navigate: missing item ID', item);
    return;
  }

  console.log('[OPEN REEL] Opening reel/product ID:', id);
  navigate(`/product/${id}`, {
    state: { from: options.from || 'feed', ...options.state }
  });
};
