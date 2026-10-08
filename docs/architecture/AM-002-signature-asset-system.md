# HOMIQ Visual Mandate — AM-002 Signature and Swappable Assets

**Status:** Approved by client · **Priority:** P0 · **Applies to:** All customer, provider, company and admin surfaces.

## Theme
HOMIQ Signature is the sole approved visual direction for the build:
- Navy `#172B3A`
- Champagne gold `#D9B777`
- Warm ivory `#F8F5EE`
- Slate `#566777`
- White `#FFFFFF`
- Typography target: Manrope headings and DM Sans body (font rollout tracked separately).

## Asset swap contract
- All asset references are centralized in `apps/web/src/visualAssets.ts`.
- Render imagery through `apps/web/src/VisualAssets.tsx` rather than hardcoding file paths in pages.
- Approved assets should be stored under `apps/web/public/assets/` and referenced using `/assets/<name>`.
- Missing artwork must render a clearly defined placeholder frame with fixed aspect ratio and no layout shift.
- Asset replacements must not require changes to booking logic, page navigation, layout dimensions, or business components.
- Final asset polishing is deferred; frames, interactions, states and accessibility are implemented now.
- Artwork should use appropriate crops, object-fit and alt text; purely decorative category imagery uses empty alt.
- Do not use unlicensed stock assets as final placeholders.

## Acceptance gates
1. Swapping any category image requires editing only its registry value and adding the image file.
2. Replacing the logo requires changing only the brand registry entry.
3. All six category frames maintain size on mobile at 320/375/390/430px.
4. No visual asset is required for booking to function.
5. A final asset audit and polish pass is scheduled after feature workflows are validated.

## Current implementation caveat
The first Signature token layer and category/logo swap frames are implemented. Some preexisting CSS colors and typography still need full migration to semantic tokens, and other role surfaces have not been built yet. No claim of full design QA is made.
