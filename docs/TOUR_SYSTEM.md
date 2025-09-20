# Product Tour System Documentation

## Overview

The Leadsnipper application includes a comprehensive product tour system built with React Shepherd that guides new users through the key features and functionality of the platform.

## Features

- **Interactive Guided Tours**: Step-by-step walkthroughs with highlighted elements
- **Page-Specific Tours**: Different tour content based on current page
- **Auto-Start for New Users**: Automatically starts tour for first-time visitors
- **Manual Tour Controls**: Users can start, restart, or skip tours at any time
- **Progress Tracking**: Remembers if users have completed the tour
- **Responsive Design**: Works on both desktop and mobile devices
- **Modern UI**: Glass morphism design with gradient backgrounds

## Components

### 1. TourContext (`/context/TourContext.tsx`)
- Provides tour state management across the application
- Handles tour activation, completion, and progress tracking
- Auto-starts tours for new users on the dashboard

### 2. ProductTour (`/components/tour/ProductTour.tsx`)
- Main tour component that renders the Shepherd tour
- Handles different tour steps based on current page
- Manages tour lifecycle events

### 3. TourTrigger (`/components/tour/TourTrigger.tsx`)
- Simple button component to manually start tours
- Multiple variants: button, help, floating
- Used in dashboard and other key locations

### 4. TourManager (`/components/tour/TourManager.tsx`)
- Advanced tour management with dropdown menu
- Allows users to start tours or reset progress
- Shows completion status

### 5. useTourState Hook (`/hooks/useTourState.ts`)
- Custom hook for managing tour state and localStorage
- Tracks visit count and completion status
- Provides methods to reset or complete tours

### 6. WelcomeModal (`/components/tour/WelcomeModal.tsx`)
- Welcome modal for new users
- Appears on first visit to dashboard
- Offers tour or skip options with benefits overview

## Tour Configuration

### Tour Steps (`/config/tourSteps.ts`)

#### Dashboard Tour
1. **Welcome** - Introduction to Leadsnipper
2. **Credits** - Explains the credit system
3. **Quick Start** - Main URL input functionality
4. **Navigation** - Sidebar navigation overview
5. **History** - Past searches and results
6. **ICP Profiles** - Smart customer profiling
7. **Complete** - Final encouragement message

#### Scraper Tour
- **Sales Intelligence Tool** - How to use the main scraping functionality

#### ICP Profiles Tour
- **Ideal Customer Profiles** - Creating and using customer profiles

## Styling

### CSS Classes
- Custom tour styles in `/styles/tour.css`
- Glass morphism design with backdrop blur
- Purple/pink gradient theme matching app design
- Responsive breakpoints for mobile devices

### Key Style Features
- Semi-transparent dark backgrounds
- Gradient buttons with hover effects
- Smooth animations and transitions
- Proper z-index management for overlays

## Usage

### Adding Tour Data Attributes

To make elements targetable by the tour, add `data-tour` attributes:

```jsx
<div data-tour="credits-display">
  {/* Your component content */}
</div>
```

### Creating New Tour Steps

1. Add the step configuration to `/config/tourSteps.ts`
2. Include the target element selector in `attachTo.element`
3. Add appropriate content with HTML markup
4. Configure buttons and actions

### Starting Tours Programmatically

```jsx
import { useTour } from '@/context/TourContext';

const { startTour } = useTour();

// Start tour
startTour();
```

## Tour Flow

1. **New User First Visit**
   - Welcome modal appears after 1 second on dashboard
   - User can choose to take tour or skip
   - If tour is taken, auto-starts after 3-second delay
   - Walks through all key features
   - Marks completion in localStorage

2. **Returning Users**
   - No auto-start or welcome modal
   - Can manually trigger via Help menu or floating button
   - Can reset progress to see tour again

3. **Page-Specific Tours**
   - Different content based on current route
   - Contextual help for specific features

## Customization

### Adding New Pages
1. Create tour steps in `tourSteps.ts`
2. Add case to `getTourSteps()` in `ProductTour.tsx`
3. Add data attributes to target elements

### Modifying Styles
- Edit `/styles/tour.css` for visual changes
- Maintain consistent theme with app design
- Test responsive behavior

### Changing Auto-Start Behavior
- Modify conditions in `TourContext.tsx`
- Adjust delay timing or trigger conditions
- Update localStorage keys if needed

## Best Practices

1. **Keep Steps Concise**: 2-3 sentences per step maximum
2. **Use Emojis**: Makes content more engaging and scannable
3. **Highlight Benefits**: Focus on value to the user
4. **Test Responsively**: Ensure tours work on all screen sizes
5. **Update with Features**: Keep tours current with app changes

## Troubleshooting

### Tour Not Starting
- Check if user has completed tour (localStorage)
- Verify data attributes are present on target elements
- Ensure TourProvider is wrapping the app

### Styling Issues
- Import order of CSS files
- Z-index conflicts with other components
- Responsive breakpoint problems

### Performance
- Tours are lazy-loaded and only active when needed
- Minimal impact on app bundle size
- Efficient localStorage usage

## Future Enhancements

- **Analytics Integration**: Track tour completion rates
- **A/B Testing**: Different tour variations
- **Contextual Help**: Inline help tooltips
- **Video Integration**: Embedded tutorial videos
- **Multi-language Support**: Internationalization
- **Advanced Targeting**: User role-based tours
