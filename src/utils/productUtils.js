export function getItemType(item) {
  if (!item) return 'product';
  // If item is explicitly marked as a reel or promotional category, it is a REEL
  if (
    item.type === 'reel' ||
    item.category === 'promotional' ||
    item.category === 'reel' ||
    item.category === 'reels'
  ) {
    return 'reel';
  }
  // Otherwise it is a standard product listing
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
