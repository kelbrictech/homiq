/**
 * HOMIQ Signature — single point of replacement for visual assets.
 * Swap null for '/assets/...' when approved artwork arrives.
 * Keep the same aspect-ratio frame: layouts must not depend on image dimensions.
 */
export const visualAssets = {
  brand: {logo: null as string | null, mark: null as string | null},
  banners: {home: null as string | null},
  heroes: {home:null as string|null,provider:null as string|null,admin:null as string|null},
  categories: {
    repairs: null, cleaning: null, maintenance: null, outdoor: null,
    moving_delivery: null, personal_assistance: null
  } as Record<string, string | null>,
  avatars: {customerDefault: null as string | null, providerDefault: null as string | null, adminDefault:null as string|null},
  illustrations: {emptyBookings: null as string | null, bookingConfirmed: null as string | null,emptyOffers:null as string|null,emptyActivity:null as string|null,noMatches:null as string|null,errorGeneric:null as string|null,verificationPending:null as string|null,reviewComplete:null as string|null,mapPlaceholder:null as string|null},
  backgrounds:{surfacePattern:null as string|null},
} as const;

/** Asset names are stable; swap paths, never page markup or booking logic. */
export const semanticIcons = {
  navigation:['home','search','calendar-days','briefcase-business','user-round','bell','layout-dashboard'],
  service:['wrench','spray-can','settings','trees','truck','hand-helping'],
  action:['arrow-left','x','chevron-right','filter','map-pin','clock','pencil','phone','message-circle','upload','refresh-cw'],
  status:['clock','badge-check','circle-x','shield-alert','check-circle','check-check','ban','hourglass'],
  rating:['star'],security:['shield-check','triangle-alert'],finance:['wallet','receipt','philippine-peso']
} as const;

/** Shared UI variants are components, not bitmap files. */
export const componentVariants={button:['primary','secondary','tertiary','danger','disabled','loading'],card:['service','booking','offer','provider','metric'],status:['neutral','warning','success','danger'],navigation:['customer','provider','admin']} as const;

