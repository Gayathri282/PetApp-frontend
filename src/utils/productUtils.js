export function getItemType(item) {
  if (!item) return 'product';
  // 1. Explicit database type property if present
  if (item.type === 'reel' || item.type === 'product') {
    return item.type;
  }
  // 2. Fallback category normalization
  if (item.category === 'promotional' || item.category === 'reel' || item.category === 'reels') {
    return 'reel';
  }
  // Products (including products containing video) are PRODUCTS!
  return 'product';
}

export function isProductItem(item) {
  return getItemType(item) === 'product';
}

export function isReelItem(item) {
  return getItemType(item) === 'reel';
}

export function logItemTypeDebug(item, sourceRoute = '') {
  if (!item) return;
  const itemType = getItemType(item);
  const showBuy = isProductItem(item);
  console.log('[ITEM TYPE DEBUG]', {
    ID: item._id || item.id,
    TYPE: itemType,
    NAME: item.name || item.title || 'Item',
    SHOW_BUY: showBuy,
    SOURCE_ROUTE: sourceRoute || (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
}
