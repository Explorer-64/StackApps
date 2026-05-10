# Design Guidelines: Firebase Web Application Migration

## Design Approach
**Selected Framework**: Design System Approach using Material Design principles
**Rationale**: For a data-driven Firebase application, consistency, scalability, and maintainability are paramount. Material Design provides robust patterns for forms, data tables, and real-time updates.

## Typography System
- **Primary Font**: Inter (Google Fonts) for UI elements
- **Secondary Font**: JetBrains Mono for code/data displays
- **Hierarchy**:
  - H1: text-4xl font-bold (page titles)
  - H2: text-2xl font-semibold (section headers)
  - H3: text-xl font-medium (subsection headers)
  - Body: text-base (standard content)
  - Small: text-sm (secondary information)
  - Captions: text-xs (metadata, timestamps)

## Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 or p-6
- Section spacing: py-8 or py-12
- Element gaps: gap-4 or gap-6
- Container max-width: max-w-7xl for main content areas

## Component Library

### Navigation
- **Top Navigation Bar**: Fixed header with logo left, primary actions right, user menu far right
- **Sidebar Navigation**: Collapsible sidebar for multi-section apps (280px expanded, 64px collapsed)
- **Tabs**: Material-style tabs with bottom border indicator for content switching

### Forms & Inputs
- **Text Inputs**: Full-width with floating labels, bottom border focus state
- **Buttons**: Rounded corners (rounded-md), clear hierarchy (primary filled, secondary outlined, tertiary text-only)
- **Dropdowns**: Material-style select menus with ripple effects on interaction
- **Toggles**: Switch components for boolean states, checkboxes for multi-select

### Data Display
- **Tables**: Striped rows, sticky headers for scrollable content, sortable columns
- **Cards**: Elevated cards (shadow-md) for grouping related information, 16px padding
- **Lists**: Dense lists for data-heavy views with dividers between items
- **Stats/Metrics**: Dashboard cards with large numbers, trend indicators

### Feedback Elements
- **Modals**: Centered overlay with backdrop blur, max-w-lg, generous padding
- **Toasts**: Top-right notifications with auto-dismiss, 4-second duration
- **Loading States**: Skeleton screens for data fetching, spinner for actions
- **Empty States**: Centered illustration/icon + helpful message + CTA

### Real-time Indicators
- **Live Data Badges**: Subtle pulse animation for real-time updates
- **Connection Status**: Top banner for offline/sync states
- **Timestamps**: Relative time display ("2 minutes ago") with tooltips

## Page Structures

### Dashboard Layout
- Header with breadcrumbs and actions
- Metric cards row (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Main content area with data tables/charts
- Sidebar for filters or quick actions

### Form Pages
- Centered container (max-w-2xl)
- Logical grouping with section headers
- Sticky action bar at bottom with Save/Cancel
- Clear validation feedback inline

### List/Table Views
- Search and filters at top
- Bulk actions toolbar when items selected
- Pagination or infinite scroll at bottom
- Row actions (edit, delete) on hover

## Icons
**Library**: Material Icons via CDN
- Use 24px size for standard UI elements
- Use 20px for compact contexts (table actions, tags)
- Use 32px+ for empty states and feature illustrations

## Animations
**Minimal & Purposeful**:
- Subtle transitions on hover states (duration-200)
- Smooth page transitions (fade-in)
- Loading skeleton shimmer
- **Avoid**: Excessive motion, parallax effects, scroll-triggered animations

## Responsive Breakpoints
- Mobile-first approach
- sm: 640px (single column layouts)
- md: 768px (introduce 2-column grids)
- lg: 1024px (full multi-column layouts, show sidebar)
- xl: 1280px (maximum content width enforcement)

## Images
**Strategic Placement**:
- **Hero Section**: No large hero image needed - this is a utility application
- **Empty States**: Illustrative SVGs or simple icons for guidance
- **User Avatars**: Circular thumbnails (40px standard, 32px compact)
- **Content Thumbnails**: In lists/tables where applicable (64px square)

## Accessibility Standards
- ARIA labels on all interactive elements
- Keyboard navigation support (tab order, escape to close)
- Focus visible states (ring-2 ring-offset-2)
- Sufficient contrast ratios (WCAG AA minimum)
- Screen reader announcements for dynamic content updates