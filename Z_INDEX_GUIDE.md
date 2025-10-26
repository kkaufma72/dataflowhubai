# Z-Index Layering Guide

## Current Z-Index Values

### High Priority (60+)
- **NewProjectModal**: `z-[60]` - Project creation modal (highest priority)

### Medium Priority (50-59)
- **AI Assistant**: `z-50` - Global AI chat modal
- **TrashBin Modals**: `z-50` - Delete confirmation modals
- **PricingCard Modal**: `z-50` - Pricing information modal
- **LandingPage Nav**: `z-50` - Landing page navigation

### Low Priority (10-49)
- **Navbar**: `z-10` - Top navigation bar
- **Navbar Dropdown**: `z-20` - User menu dropdown
- **LandingPage Banner**: `z-40` - Top banner
- **Help Button**: `z-40` - In-app help button

## Z-Index Hierarchy Rules

1. **Modals** should always be above everything else (z-60+)
2. **AI Assistant** should be above regular UI but below critical modals (z-50)
3. **Navigation elements** should be above content but below modals (z-10-20)
4. **Background overlays** should be below content (z-0-10)

## Fixed Issues

✅ **NewProjectModal vs AI Assistant**: 
- NewProjectModal: `z-50` → `z-[60]` (now appears above AI assistant)
- AI Assistant: `z-50` (stays the same)

## Best Practices

- Use `z-[60]` for critical user action modals
- Use `z-50` for secondary modals and AI assistant
- Use `z-40` for help and utility overlays
- Use `z-20` for dropdowns and menus
- Use `z-10` for navigation bars
