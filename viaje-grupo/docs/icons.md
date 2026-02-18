# Icon Usage Guide

## Overview

Text The Check uses **unplugin-icons** for all icons in the client application. This provides a consistent, performant way to use icons from various icon sets.

## Setup

Icons are configured in `client/nuxt.config.ts`:

```typescript
import Icons from 'unplugin-icons/vite'

export default defineNuxtConfig({
  vite: {
    plugins: [
      Icons({
        autoInstall: true,
        compiler: 'vue3'
      })
    ]
  }
})
```

## Dependencies

```json
{
  "unplugin-icons": "^latest",
  "@iconify/json": "^latest"
}
```

## Usage

### Importing Icons

Import icons using the virtual module path pattern:

```typescript
import IconInformationCircle from '~icons/mdi/information-circle'
import IconPlus from '~icons/mdi/plus'
import IconClose from '~icons/mdi/close'
import IconMapMarker from '~icons/mdi/map-marker'
```

### Using Icons in Templates

```vue
<template>
  <button class="flex items-center gap-2">
    <IconPlus class="w-5 h-5" />
    Agregar gasto
  </button>

  <IconInformationCircle class="h-4 w-4 text-gray-500" />
</template>

<script setup>
import IconPlus from '~icons/mdi/plus'
import IconInformationCircle from '~icons/mdi/information-circle'
</script>
```

## Available Icon Sets

The `@iconify/json` package includes thousands of icon sets. Common ones:

- **Material Design Icons**: `~icons/mdi/...`
- **Heroicons**: `~icons/heroicons/...`
- **Font Awesome**: `~icons/fa/...`
- **Bootstrap Icons**: `~icons/bi/...`

Browse all available icons at: https://icon-sets.iconify.design/

## Best Practices

1. **Use Material Design Icons (MDI) as primary set** for consistency
2. **Size classes**: Use Tailwind classes like `w-4 h-4`, `w-5 h-5`, `w-6 h-6`
3. **Color**: Icons inherit text color, use `text-*` classes
4. **Naming**: Use descriptive variable names like `IconMapMarker` instead of `Icon1`

## Common Icons

### Navigation & Actions
```typescript
import IconPlus from '~icons/mdi/plus'
import IconClose from '~icons/mdi/close'
import IconArrowLeft from '~icons/mdi/arrow-left'
import IconArrowRight from '~icons/mdi/arrow-right'
import IconMenu from '~icons/mdi/menu'
```

### Information & Status
```typescript
import IconInformationCircle from '~icons/mdi/information-circle'
import IconAlertCircle from '~icons/mdi/alert-circle'
import IconCheckCircle from '~icons/mdi/check-circle'
import IconCloseCircle from '~icons/mdi/close-circle'
```

### Finance & Payment
```typescript
import IconCurrencyUsd from '~icons/mdi/currency-usd'
import IconBank from '~icons/mdi/bank'
import IconCreditCard from '~icons/mdi/credit-card'
import IconSwapHorizontal from '~icons/mdi/swap-horizontal'
```

### Location & Groups
```typescript
import IconMapMarker from '~icons/mdi/map-marker'
import IconAccountGroup from '~icons/mdi/account-group'
import IconHome from '~icons/mdi/home'
```

## Example: Replacing SVG with Icon

### Before (inline SVG)
```vue
<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
</svg>
```

### After (unplugin-icons)
```vue
<script setup>
import IconMapMarker from '~icons/mdi/map-marker'
</script>

<template>
  <IconMapMarker class="w-4 h-4 text-gray-600" />
</template>
```

## Notes

- Icons are auto-imported when needed (thanks to `autoInstall: true`)
- No runtime overhead - icons are compiled at build time
- Tree-shakeable - only icons you use are included in the bundle
- TypeScript support is automatic

## Migration Checklist

When converting existing SVGs to icons:

1. Find equivalent icon on https://icon-sets.iconify.design/
2. Import the icon at the top of the script section
3. Replace the SVG with the icon component
4. Apply the same classes (size, color) to the icon
5. Test that the icon displays correctly
