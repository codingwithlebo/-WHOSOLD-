---
name: Sunset Arcade
colors:
  surface: '#fff8f3'
  surface-dim: '#dfd9d4'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f2ed'
  surface-container: '#f3ede8'
  surface-container-high: '#eee7e2'
  surface-container-highest: '#e8e1dc'
  on-surface: '#1d1b18'
  on-surface-variant: '#584237'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f6efeb'
  outline: '#8c7165'
  outline-variant: '#e0c0b2'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#ff7626'
  on-primary-container: '#5f2300'
  inverse-primary: '#ffb693'
  secondary: '#7446b1'
  on-secondary: '#ffffff'
  secondary-container: '#bf8fff'
  on-secondary-container: '#4f1d8c'
  tertiary: '#aa3148'
  on-tertiary: '#ffffff'
  tertiary-container: '#fe7084'
  on-tertiary-container: '#710022'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#eddcff'
  secondary-fixed-dim: '#d8b9ff'
  on-secondary-fixed: '#290055'
  on-secondary-fixed-variant: '#5b2b98'
  tertiary-fixed: '#ffdadc'
  tertiary-fixed-dim: '#ffb2b9'
  on-tertiary-fixed: '#40000f'
  on-tertiary-fixed-variant: '#8a1732'
  background: '#fff8f3'
  on-background: '#1d1b18'
  surface-variant: '#e8e1dc'
typography:
  headline-xl:
    fontFamily: Rubik
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Rubik
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
  headline-lg:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Rubik
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-lg:
    fontFamily: Rubik
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 18px
  label-md:
    fontFamily: Rubik
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
  label-sm:
    fontFamily: Rubik
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-sm: 0.75rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system defines a luminous, tactile 3D casual arcade aesthetic built for joyful competition and instantaneous readability. Designed for casual mobile gamers and energetic digital experiences, it rejects dark, gloomy gaming conventions in favor of a radiant sunset spectrum: saturated citrus orange, vibrant lavender purple, and juicy coral pink.

The style fuses modern soft-tactile depth, candy-like glossy highlights, and bold rounded typography. Interfaces must feel like tangible, polished physical game pieces resting on warm cream slabs—rich in springy micro-interactions, pillowy bevels, and crisp caramel edges rather than murky charcoal shadows.

## Colors
The palette is anchored by a triad of high-energy sunset hues balanced against sunlit dairy creams and rich chestnut typography:

- **Primary (`#FF7626`)**: Warm sunset orange. Commands primary gameplay actions, main purchase triggers, high-value badges, and gold coin accents.
- **Secondary (`#A879E8`)**: Electric lavender purple. Fuels mystery drops, level indicators, power-up timers, and energetic contrast elements.
- **Tertiary (`#FF7185`)**: Juicy coral pink. Directs secondary alerts, high-stakes events, lives/hearts, and dynamic gradients.
- **Canvas & Surface Creams**: Base canvas spans `#FFF8F3` (warm cream) and `#FFF3EB`, shifting to `#FFE8DC` (soft peach) and `#F7F0FF` (pale lavender) for inset wells, card trays, and layered panels.
- **Text & Structure Neutrals**: Never use pitch black or desaturated grey. High-contrast typography employs deep warm chestnut (`#2D140F`) and espresso (`#3D1E16`). Inset borders and dimensional bevels employ warm caramel (`#E59A6E`, `#D66D43`).
- **Gradients**: Fluid linear transitions between primary and tertiary (`linear-gradient(135deg, #FF7626 0%, #FF7185 100%)`) and lavender depth (`linear-gradient(135deg, #C29BFA 0%, #A879E8 100%)`).

## Typography
Typographic rhythm relies exclusively on **Rubik** across all tiers. Its squircle-adjacent letterforms, geometric clarity, and thick stroke terminals inject playful friendliness while maintaining ultra-high legibility during rapid gameplay.

- **Headlines**: ExtraBold (800) and Bold (700) weights. Headlines on candy-colored surfaces may use subtle white inner strokes or a soft drop shadow in 20% opacity warm caramel (`#D66D43`) to pop off the surface.
- **Labels & Badges**: Bold (700) and Black/ExtraBold (800) in all-caps or title case with slight positive tracking (+0.5px) for score counters, power-up badges, and coin tallies.
- **Body**: Medium (500) and Regular (400) weights set exclusively in `#2D140F` for crisp readability on cream backgrounds, or pure `#FFFFFF` against saturated sunset cards.

## Layout & Spacing
The layout follows a fluid-responsive system engineered around handheld mobile viewport comfort while scaling cleanly to tablets.

- **Grid & Margins**: Compact viewports utilize a 4-column structure with `margin-sm` (12px) and `gutter-sm` (12px) to maximize tactile canvas space. Desktop and tablet views expand to an 8-column layout with `margin-lg` (32px) and `gutter-lg` (24px) capped at a max-width container of 840px to preserve arcade immediacy.
- **Rhythm**: Element padding leans on comfortable, thumb-friendly targets. Tap targets are spaced strictly using `space-md` (16px) or larger gaps to prevent mis-taps during frenetic play sessions.

## Shapes
Shapes express a squishy, inviting pill aesthetic (Level 3 - Pill-shaped). Sharp corners and brutalist intersections are entirely prohibited.

- **Primary Actions & Badges**: Fully pill-shaped (`roundedness: 3`, border-radius: 9999px) creating a signature arcade token silhouette.
- **Cards, Trays & Dialogue Panels**: Generously rounded corners (`2rem` / 32px) reminiscent of smooth molded plastic toys.
- **Inner Indicators & Toggles**: Pill capsules (`1rem` to `2rem`) matching the overarching rounded geometry.

## Components

- **Buttons**:
  - *Primary Button*: Saturated sunset orange (`#FF7626`) pill with an inset top highlight (`inset 0 2px 0 rgba(255,255,255,0.5)`), a 4px caramel bottom edge (`box-shadow: 0 5px 0 #D66D43`), and bold white Rubik text. On tap/active, the button compresses downward by 4px (`transform: translateY(4px); box-shadow: 0 1px 0 #D66D43`).
  - *Secondary Button*: Juicy coral pink (`#FF7185`) with matching deep coral extrusion (`box-shadow: 0 5px 0 #D93B52`).
  - *Ghost / Neutral Button*: Cream base (`#FFF3EB`) with a warm caramel outline (`2px solid #E59A6E`), chestnut text (`#2D140F`), and an extruded base (`box-shadow: 0 4px 0 #E59A6E`).

- **Chips & Badges**:
  - Pill-shaped capsules for currencies, score multipliers, and player status.
  - Lavender chip (`#A879E8`) paired with white text for mystery modifiers and power-up meters.
  - Coral chip (`#FF7185`) paired with white text for lives, multipliers, and urgent alerts.
  - All chips feature an ultra-soft translucent white top sheen.

- **Cards & Surface Slabs**:
  - Constructed with creamy warm surfaces (`#FFF3EB`), a 2px stroke in `#FFE8DC`, and a soft bottom lip (`box-shadow: 0 6px 0 #F3D3C1, 0 12px 24px rgba(255, 118, 38, 0.08)`).
  - Internal card groupings nest within softly tinted sunken wells (`#FFE8DC` or `#F7F0FF`).

- **Input Fields**:
  - Thick, pillowy text fields with a soft cream background (`#FFF8F3`), inset border (`2px solid #E59A6E`), and deep chestnut text (`#2D140F`).
  - Focused state triggers an electric purple halo (`box-shadow: 0 0 0 4px #A879E8`) with crisp white interior fill.

- **Checkboxes & Radios**:
  - Oversized, squircle-shaped chunky selectors (`24px × 24px`).
  - Unchecked: `#FFE8DC` base with a caramel border (`#E59A6E`).
  - Checked: Solid `#FF7626` base with an embossed, crisp white checkmark and a slight glossy inner rim.

- **Game HUD & Header Bars**:
  - Bright floating pods over canvas, never solid dark banners. Currency pods display a 3D coin or gem icon slightly breaking the top-left boundary of the pill container.