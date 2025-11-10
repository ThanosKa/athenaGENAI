# Design Patterns

## UI Foundation

- Use shadcn/ui components as base - they're pre-styled and accessible
- Modern SaaS aesthetic: clean, minimal, good contrast (Linear-inspired)
- Use Tailwind's default spacing scale - don't overthink it

## Color Palette (Linear-inspired)

### Primary Colors

- **Magic Blue**: `#5E6AD2` - Primary brand color (desaturated blue)
- **Mercury White**: `#F4F5F8` - Background/secondary background
- **Nordic Gray**: `#222326` - Primary text color

### Status Colors

- **Success**: Green (`#10B981` or Tailwind `green-500`)
- **Error**: Red (`#EF4444` or Tailwind `red-500`)
- **Warning**: Amber (`#F59E0B` or Tailwind `amber-500`)
- **Info**: Blue (`#3B82F6` or Tailwind `blue-500`)

### Neutral Colors

- **Background**: White (`#FFFFFF`)
- **Background Secondary**: `#F4F5F8`
- **Border**: `#E0E0E0` or Tailwind `gray-200`
- **Text Secondary**: `#6B7280` or Tailwind `gray-500`
- **Text Tertiary**: `#9CA3AF` or Tailwind `gray-400`

## Typography

- **Font Family**: Inter or system sans-serif (Inter is default in Next.js)
- **Headings**: Semibold (600) or Bold (700)
- **Body**: Regular (400) or Medium (500)
- **Font Scale**: Use Tailwind defaults (text-sm, text-base, text-lg, etc.)
- **Line Height**: Let Tailwind handle it (defaults are good)

## CTA & Buttons

- **Primary CTA**: Magic Blue (`#5E6AD2`) with white text
- **Hover State**: Slightly darker shade
- **Secondary**: Transparent with border or subtle background
- **Ghost**: Transparent, text color only
- Use shadcn Button component with variants

## Layout Principles

- Focus on readability and whitespace - let content breathe
- Responsive by default with Tailwind breakpoints
- Avoid custom CSS when Tailwind utilities work
- Use consistent padding/margins (p-4, p-6, gap-4, gap-6)
- Cards: Subtle shadow (`shadow-sm` or `shadow-md`) with rounded corners (`rounded-lg`)

## Component Patterns

- Cards: Use shadcn Card component with subtle shadow/border
- Buttons: Use shadcn Button with appropriate variants (default, secondary, ghost)
- Forms: Use shadcn Form components with proper labels and error states
- Tables: Use shadcn Table for data display
- Dialogs: Use shadcn Dialog/Sheet for modals and sidebars

## Dashboard Specific

- Use clear visual hierarchy (headings, spacing, contrast)
- Show loading states for async operations
- Display errors/warnings prominently but not intrusively
- Use status badges/indicators for approval states (pending, approved, rejected)
- Dark backgrounds for cards/containers work well (`bg-gray-50` or `bg-white` with border)
