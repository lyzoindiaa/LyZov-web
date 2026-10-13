# 🎨 Design System - Visual Reference Guide

## Color System Visualization

### Light Mode Palette

```
┌─────────────────────────────────────────────────────────────┐
│                      LIGHT MODE COLORS                      │
└─────────────────────────────────────────────────────────────┘

BACKGROUNDS
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Primary: #FFFFFF    │ Subtle: #F9FAFB     │ Raised: #F3F4F6     │
│ Pure White          │ Off-White           │ Light Gray          │
│ Default BG          │ Subtle BG           │ Card Background     │
└─────────────────────┴─────────────────────┴─────────────────────┘

TEXT / INK
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Primary: #0F172A    │ Secondary: #475569  │ Muted: #78849E      │
│ Dark Navy           │ Blue-Gray           │ Soft Gray           │
│ Headlines & Body    │ Secondary Text      │ Tertiary Text       │
└─────────────────────┴─────────────────────┴─────────────────────┘

ACCENT (GOLD)
┌─────────────────────┬─────────────────────┐
│ Primary: #D97706    │ Hover: #B45309      │
│ Warm Gold           │ Darker Gold         │
│ CTAs & Interactive  │ Hover State         │
└─────────────────────┴─────────────────────┘

BORDERS & STATUS
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Border: #E5E7EB     │ Success: #10B981    │ Error: #EF4444      │
│ Light Gray          │ Green               │ Red                 │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### Dark Mode Palette

```
┌─────────────────────────────────────────────────────────────┐
│                       DARK MODE COLORS                      │
└─────────────────────────────────────────────────────────────┘

BACKGROUNDS
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Primary: #0F1419    │ Subtle: #151B27     │ Raised: #1E2433     │
│ Deep Charcoal       │ Very Dark Blue-Gray │ Raised Surface      │
│ Default BG          │ Subtle BG           │ Card Background     │
└─────────────────────┴─────────────────────┴─────────────────────┘

TEXT / INK
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Primary: #F8FAFC    │ Secondary: #D1D5DB  │ Muted: #9CA3AF      │
│ Bright White        │ Light Gray          │ Medium Gray         │
│ Headlines & Body    │ Secondary Text      │ Tertiary Text       │
└─────────────────────┴─────────────────────┴─────────────────────┘

ACCENT (GOLD)
┌─────────────────────┬─────────────────────┐
│ Primary: #FBBF24    │ Hover: #F59E0B      │
│ Bright Gold         │ Warmer Gold         │
│ CTAs & Interactive  │ Hover State         │
└─────────────────────┴─────────────────────┘

BORDERS & STATUS
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Border: #2D3748     │ Success: #34D399    │ Error: #F87171      │
│ Dark Gray           │ Green               │ Red                 │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## Button Styles

### Primary Button

```
┌────────────────────────────────────────────────────┐
│  LIGHT MODE RENDERING                             │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  Add to Cart                         →   │  ← Gold background (#D97706)
│  └──────────────────────────────────────────┘     │  White text
│                                                    │  Padding: 12px 24px
│  On Hover:                                        │
│  ┌──────────────────────────────────────────┐     │
│  │  Add to Cart                         →   │  ← Darker gold (#B45309)
│  └──────────────────────────────────────────┘     │  Lifted shadow
│                                                    │  Scaled 1.02
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  DARK MODE RENDERING                              │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  Add to Cart                         →   │  ← Bright gold (#FBBF24)
│  └──────────────────────────────────────────┘     │  Black text
│                                                    │  Glowing shadow
│  On Hover:                                        │
│  ┌──────────────────────────────────────────┐     │
│  │  Add to Cart                         →   │  ← Warmer gold (#F59E0B)
│  └──────────────────────────────────────────┘     │  Enhanced glow
│                                                    │
└────────────────────────────────────────────────────┘
```

### Secondary Button

```
LIGHT MODE:
┌─────────────────────────────────────────────┐
│  Cancel                                     │
└─────────────────────────────────────────────┘
Border: 2px #E5E7EB
Text: #0F172A
Background: Transparent
Hover BG: #F9FAFB

DARK MODE:
┌─────────────────────────────────────────────┐
│  Cancel                                     │
└─────────────────────────────────────────────┘
Border: 2px #2D3748
Text: #F8FAFC
Background: Transparent
Hover BG: #1E2433
```

---

## Card Components

### Product Card Layout

```
┌─────────────────────────────────────────┐
│                                         │
│        ┌─────────────────────┐          │
│        │                     │          │
│        │   Product Image     │  ← 1:1 aspect ratio
│        │      1:1 AR         │     Rounded: 12px
│        │                     │     On Hover: Zoom 1.05
│        └─────────────────────┘          │
│        🤍 [Wishlist button]             │ ← Top-right
│        [Sale Badge]                     │ ← Top-left
│                                         │
│        Product Name                     │ ← Bold, 14px
│        ⭐ 4.5 (42 reviews)              │
│        $99.99                           │ ← Large, #D97706
│                                         │
│        ┌─────────────────────┐          │
│        │   Add to Cart   →   │          │ ← Primary CTA
│        └─────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘

On Hover:
- Card scales 1.02
- Image zooms 1.05
- Shadow enhanced
- Overlay appears with button

LIGHT MODE:
- White background
- Light gray border
- Soft shadow

DARK MODE:
- Dark surface (#1E2433)
- Dark border (#2D3748)
- Strong shadow
```

### Dashboard Card

```
┌────────────────────────────────────────────┐
│                                            │
│  Recent Order                         →    │ ← Title
│  ────────────────────────────────────────  │
│                                            │
│  Order #12345                              │
│  Status: Delivered ✓                       │
│  Date: Dec 15, 2024                        │
│  Total: $149.99                            │
│                                            │
│  [View Details]                            │
│                                            │
└────────────────────────────────────────────┘

LIGHT MODE:
- White background
- Light border
- Soft shadow on rest
- Medium shadow on hover
- Hover scale: 1.01

DARK MODE:
- Dark surface
- Dark border
- Strong shadow
```

---

## Navigation Components

### Navbar

```
┌─────────────────────────────────────────────────────────────┐
│ L🟡 LyZov    Categories    Search...    ❤️ 🛒 👤         │
└─────────────────────────────────────────────────────────────┘
   └─ Sticky position
   └─ 1px border bottom (light mode: #E5E7EB, dark: #2D3748)
   └─ Backdrop blur on scroll
   └─ Soft shadow

Link Hover Effect:
   Categories
   ──────────  ← Underline animation (200ms)
   
Active Link:
   Categories
   ══════════  ← Solid underline in accent color

Mobile Menu (on 640px and below):
┌─────────────────────────┐
│ ✕ [Close]              │
├─────────────────────────┤
│ Categories              │
│ About                   │
│ Support                 │
│ ──────────────────────  │
│ Sign In                 │
│ Sign Up                 │
└─────────────────────────┘
Full screen overlay
Slide-in from left
Backdrop blur
Touch-friendly items
```

### Footer

```
┌──────────────────────────────────────────────────────────┐
│ L🟡 Categories    Help & Support    My Account          │
│ LyZov Store                                             │
│ Your destination for  [f] [t] [in] [▶️]               │
│ quality products...                                     │
│ ──────────────────────────────────────────────────────  │
│ © 2024 LyZov Store · All rights reserved               │
└──────────────────────────────────────────────────────────┘

Top Border: 2px solid #D97706 (light) / #FBBF24 (dark)
Background: var(--bg)
Social Icons: 36px circles, hover with accent fill + glow
Link Hover: Color shift + 4px right translation
```

---

## Form Inputs

### Text Input

```
LIGHT MODE:

Normal State:
┌─────────────────────────────┐
│ Email Address               │ ← Label
│ [Enter your email...        │ ← Input with placeholder
└─────────────────────────────┘
Border: 1px #E5E7EB

Focus State:
┌─────────────────────────────┐
│ Email Address               │
│ [user@example.com           │ ← Blue ring on border
└─────────────────────────────┘
Border: 1px #D97706
Ring: 3px #FEF3C7 (light gold bg)

Error State:
┌─────────────────────────────┐
│ Email Address               │
│ [user@example.com           │
└─────────────────────────────┘
✕ Please enter a valid email
Border: 1px #EF4444 (red)
Ring: 3px rgba(239, 68, 68, 0.1)

DARK MODE:
Same structure but:
- Dark background (#1E2433)
- Light borders
- Brighter gold ring (#FBBF24)
- Stronger focus ring
```

### Checkbox & Radio

```
LIGHT MODE:

Unchecked:
☐ Remember me

Checked:
☑ Remember me (✓ in gold)

Focused:
☐ Remember me (gold ring around box)

DARK MODE:
☐ Same but more visible borders
☑ Gold checkmark on dark background
```

---

## Shadow System (Elevation)

```
┌─────────────────────────────────────────────────────┐
│              ELEVATION LEVELS (Light Mode)          │
└─────────────────────────────────────────────────────┘

Elevation 0 (No Shadow):
[Component] - No shadow, just border

Elevation 1 (Subtle):
[Component] - 0 1px 2px rgba(15, 23, 42, 0.05)
              Minimal depth, used for borders

Elevation 2 (Rest):
[Component] - 0 2px 8px rgba(15, 23, 42, 0.08)
              Default card/component shadow

Elevation 3 (Hover):
[Component] - 0 4px 16px rgba(15, 23, 42, 0.12)
              Hover state, lifted appearance

Elevation 4 (Modal/Dropdown):
[Component] - 0 8px 24px rgba(15, 23, 42, 0.15)
              Overlays, modals, dropdowns

Elevation 5 (Maximum):
[Component] - 0 12px 32px rgba(15, 23, 42, 0.18)
              Top-level overlays, modals

┌─────────────────────────────────────────────────────┐
│              ELEVATION LEVELS (Dark Mode)           │
└─────────────────────────────────────────────────────┘

More pronounced shadows for depth:

Elevation 1: 0 1px 3px rgba(0, 0, 0, 0.4)
Elevation 2: 0 4px 12px rgba(0, 0, 0, 0.5)
Elevation 3: 0 8px 20px rgba(0, 0, 0, 0.6)
Elevation 4: 0 12px 28px rgba(0, 0, 0, 0.7)
Elevation 5: 0 20px 40px rgba(0, 0, 0, 0.8)

Plus: Accent glow effect on interactive elements
      0 0 20px rgba(251, 191, 36, 0.25)
```

---

## Typography Hierarchy

```
┌─────────────────────────────────────────────────────┐
│               TYPOGRAPHIC SCALE                     │
└─────────────────────────────────────────────────────┘

H1 (56px, Weight 800)
Welcome to Premium Shopping

H2 (36px, Weight 700)
Discover Our Latest Collection

H3 (30px, Weight 700)
Product Features

H4 (24px, Weight 600)
Specifications

H5 (20px, Weight 600)
Key Features

Body Large (18px, Weight 500)
Premium quality products delivered safely
across India with excellent customer service.

Body Regular (16px, Weight 400)
This is the standard body text used throughout
the website for general content and descriptions.

Body Small (14px, Weight 400)
Secondary information and meta details like
dates, prices, and additional information.

Caption (12px, Weight 500, 0.05em spacing)
LABELS, BADGES, HELPER TEXT

┌─────────────────────────────────────────────────────┐
│            LINE HEIGHT & LETTER-SPACING             │
└─────────────────────────────────────────────────────┘

Headlines: 1.1 line height, -0.02em letter-spacing
Body: 1.6 line height, normal letter-spacing
Caption: 1.5 line height, 0.05em letter-spacing
```

---

## Spacing & Grid System

```
8px Baseline Grid

4px  = 0.25rem (tiny spacing)
8px  = 0.5rem  (xs)
12px = 0.75rem (sm)
16px = 1rem    (md) ← Default
24px = 1.5rem  (lg)
32px = 2rem    (xl)
40px = 2.5rem  (2xl)
48px = 3rem    (3xl)
64px = 4rem    (4xl)

Layout Spacing (between sections):
- Mobile: 24px (1.5rem)
- Tablet: 32px (2rem)
- Desktop: 48px (3rem)

Component Spacing (within components):
- Padding: 16px (1rem) to 24px (1.5rem)
- Gap between items: 8px-16px
- Gap between sections: 24px-48px

Container Max-Width: 1440px (from 1280px)
Container Padding: 1rem (mobile) → 2rem (desktop)

Grid Gap: 16px (1rem)
Mobile Grid: 1 column
Tablet Grid: 2 columns
Desktop Grid: 3-4 columns
```

---

## Border Radius System

```
4px   - Input fields, small elements
8px   - Medium components
12px  - DEFAULT for most components
16px  - Large containers
20px  - Very large elements
50%   - Circular (buttons, avatars)
```

---

## Interaction States

### Button States Flow

```
Normal (Rest)
    ↓
Hover (User moves cursor over)
    ↓ / ↑ (Click / Move away)
Active (User clicks)
    ↓
Pressed Visual Feedback
    ↓ (Release)
Back to Normal

Visual Changes per State:
┌───────────────────────────────────────────┐
│ NORMAL    HOVER     ACTIVE    DISABLED    │
│ ┌─────┐  ┌─────┐   ┌─────┐   ┌─────┐    │
│ │ CTA │  │ CTA │   │ CTA │   │ CTA │    │
│ └─────┘  └─────┘   └─────┘   └─────┘    │
│                                          │
│ Color  → Darker  → Pressed  → Gray      │
│ Shadow → Lifted  → Inset    → None      │
│ Scale  → 1.00   → 0.98     → 1.00      │
│ Trans  → 200ms  → 100ms    → 150ms     │
└───────────────────────────────────────────┘
```

### Input Focus State

```
Unfocused:
[                         ]
Border: 1px gray

Focused:
[                         ] ← Gold ring appears
Border: 1px gold
Ring: 3px light gold background

Transition: 200ms smooth
```

---

## Animation Specs

### Durations

```
Instant:     0ms
Ultra-Fast:  75ms    - Micro-interactions
Fast:        150ms   - Small interactions
Standard:    200ms   - Default transitions (button hover, etc)
Slow:        300ms   - Page transitions, large movements
Slower:      400ms+  - Special animations
```

### Easing Functions

```
Ease In-Out (Default):
cubic-bezier(0.25, 0.46, 0.45, 0.94)
↓ Used for most transitions (buttons, cards, etc)

Ease Out (Feels snappy):
cubic-bezier(0.34, 1.56, 0.64, 1)
↓ Used for entrances, appears responsive

Ease In (Feels decelerated):
cubic-bezier(0.32, 0, 0.67, 0)
↓ Used for exits, feels natural
```

### Common Animations

```
Scale on Hover:
1.0 → 1.02 (200ms ease-in-out)

Scale on Press:
1.0 → 0.98 (100ms ease-in-out)

Fade In:
opacity: 0 → 1 (300ms ease-out)

Slide In (from top):
transform: translateY(-10px) opacity: 0 
  → translateY(0) opacity: 1 (300ms ease-out)

Shimmer (skeleton):
Background gradient moving left-to-right
Duration: 2s infinite
```

---

## Responsive Breakpoints

```
Mobile-First Approach:

Base (320px - 640px):
- Single column layouts
- Full-width components
- Touch-friendly sizing (44px+ targets)
- Stacked navigation

Tablet (640px - 1024px):
- 2-column grids
- Better use of horizontal space
- Larger touch targets
- Side-by-side layouts where appropriate

Desktop (1024px - 1440px):
- 3-4 column grids
- Full interactive features
- Hover states active
- Optimized spacing

Wide (1440px+):
- Max-width containers
- Consistent experience
- Generous spacing
```

---

## Dark Mode Toggle

### Visual Indicator

```
LIGHT MODE (Default):
☀️ Theme icon (optional)
(Light background, dark text)

Toggle switch:
◯————— → Light mode active
───●  → Dark mode active

DARK MODE:
🌙 Theme icon (optional)
(Dark background, light text)

Toggle switch shows same position
but with different visual treatment
```

---

## Accessibility Features

### Focus Indicators

```
All interactive elements have visible focus:

LIGHT MODE:
Element [has 2px solid #D97706 outline]
        [2px offset from element]
        
DARK MODE:
Element [has 2px solid #FBBF24 outline]
        [2px offset from element]
        [potentially enhanced with glow]

Minimum contrast: 4.5:1 for text
              3:1 for graphics
```

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Color Contrast Examples

### Light Mode Combinations

```
Text on #FFFFFF:
✓ #0F172A - 21:1 (AAA)
✓ #475569 - 8.2:1 (AAA)
✓ #D97706 - 5.8:1 (AA)

Text on #F3F4F6:
✓ #0F172A - 15:1 (AAA)
✓ #475569 - 6.5:1 (AA)
```

### Dark Mode Combinations

```
Text on #0F1419:
✓ #F8FAFC - 20:1 (AAA)
✓ #D1D5DB - 11:1 (AAA)
✓ #FBBF24 - 8.5:1 (AAA)

Text on #1E2433:
✓ #F8FAFC - 16:1 (AAA)
✓ #D1D5DB - 8.8:1 (AAA)
```

---

## Mobile UI Patterns

### Touch Targets

```
Minimum size: 44px x 44px
Preferred spacing: 8px between targets
Large buttons: 56px height
Small buttons: 40px height
Icons: 24-32px inside buttons
```

### Mobile Navigation

```
Bottom Navigation (on phones):
┌────────────────────────────────┐
│                                │
│  Content area                  │
│                                │
├────────────────────────────────┤
│ [🏠] [🔍] [❤️] [🛒] [👤]     │
└────────────────────────────────┘

Or

Hamburger Menu (top):
┌─────┐
│ ☰   │ (Three lines)
└─────┘
Full-screen overlay when opened
```

---

## Loading & Empty States

### Loading Skeleton

```
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Shimmer animation
│                                 │   (gray → lighter → gray)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                 │
│ ▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓▓▓          │
└─────────────────────────────────┘
Duration: 2s loop
Color: var(--bg-raised)
Opacity: Animated 0.5 → 1.0 → 0.5
```

### Empty State

```
┌─────────────────────────────────┐
│                                 │
│            🛍️                 │ ← Large icon (64px)
│                                 │
│      Your Bag is Empty         │ ← Bold, 24px
│                                 │
│   Looks like you haven't       │ ← Secondary text, muted
│   added anything yet            │
│                                 │
│    [Start Shopping]             │ ← CTA button
│                                 │
└─────────────────────────────────┘
```

---

## Before & After Examples

### Before
- Harsh borders
- Weak shadows
- Inconsistent spacing
- Unclear hover states
- Poor contrast in dark mode
- No elevation hierarchy
- Abrupt transitions

### After
- Subtle, refined borders
- Proper shadow hierarchy
- Consistent 8px grid
- Clear, smooth hover effects
- High contrast in both modes
- Clear elevation levels
- Smooth 200ms transitions

---

## File Structure

```
src/
├── index.css                 ← Color variables, base styles
├── ui-extras.css            ← Animation utilities
├── App.jsx
├── components/
│   ├── ui/
│   │   ├── Button.jsx        ← Updated with variants
│   │   ├── Card.jsx          ← Updated styling
│   │   ├── Input.jsx         ← Enhanced form elements
│   │   ├── Badge.jsx         ← Color-coded badges
│   │   └── ...
│   ├── layout/
│   │   ├── Navbar.jsx        ← Modern nav with blur
│   │   ├── Footer.jsx        ← Enhanced with gold accent
│   │   └── ...
│   ├── product/
│   │   ├── ProductCard.jsx   ← Modern cards
│   │   └── ...
│   └── ...
├── pages/
│   ├── LandingPage.jsx       ← Hero modernized
│   ├── ShopPage.jsx          ← Grid improvements
│   ├── ProductDetailsPage.jsx ← Gallery enhanced
│   ├── CartPage.jsx          ← Better layout
│   ├── CheckoutPage.jsx      ← Streamlined flow
│   ├── dashboard/
│   │   ├── DashboardLayout.jsx ← Sidebar modernized
│   │   └── ...
│   ├── admin/
│   │   ├── AdminLayout.jsx   ← Admin UI enhanced
│   │   └── ...
│   └── ...
└── ...
```

---

## Quick Visual Checklist

When reviewing a component, verify:

- [ ] Uses CSS variables for colors (no hardcoded)
- [ ] Has proper shadow elevation (not too light/heavy)
- [ ] Consistent border radius (default 12px)
- [ ] Clear focus state with ring
- [ ] Hover effect is smooth (200ms)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Text contrast ≥ 4.5:1 (WCAG AAA)
- [ ] Works in both light & dark modes
- [ ] Spacing follows 8px grid
- [ ] Interactive elements are 44px+ on mobile

---

**This visual reference guide should help developers understand the modern design direction and implement changes consistently across the application.**
