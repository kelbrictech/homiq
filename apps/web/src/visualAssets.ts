/**
 * HOMIQ Signature — single point of replacement for visual assets.
 * Swap null for '/assets/...' when approved artwork arrives.
 * Keep the same aspect-ratio frame: layouts must not depend on image dimensions.
 */
export const visualAssets = {
  brand: {logo: null as string | null, mark: null as string | null},
  banners: {home: null as string | null},
  categories: {
    repairs: null, cleaning: null, maintenance: null, outdoor: null,
    moving_delivery: null, personal_assistance: null
  } as Record<string, string | null>,
  avatars: {customerDefault: null as string | null, providerDefault: null as string | null},
  illustrations: {emptyBookings: null as string | null, bookingConfirmed: null as string | null},
} as const;
