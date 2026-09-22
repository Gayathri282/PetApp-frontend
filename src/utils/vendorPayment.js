/**
 * Canonical helper to extract vendor's public UPI ID from vendor object.
 * Canonical backend path: vendor.vendorDetails.upiDetails.upiId
 */
export function getVendorUpiId(vendor) {
  if (!vendor) return '';
  return (
    vendor.vendorDetails?.upiDetails?.upiId ||
    vendor.upiDetails?.upiId ||
    vendor.upiId ||
    ''
  ).trim();
}

/**
 * Canonical helper to extract vendor's display name for UPI payments.
 * Canonical backend path: vendor.vendorDetails.upiDetails.upiName or vendor.name
 */
export function getVendorUpiName(vendor) {
  if (!vendor) return 'Vendor';
  return (
    vendor.vendorDetails?.upiDetails?.upiName ||
    vendor.upiDetails?.upiName ||
    vendor.name ||
    'Vendor'
  ).trim();
}
