# PayTrackr - Web (Frontend)

A Progressive Web Application for personal financial management built with Nuxt 3, focusing on recurring payment tracking, one-time expense management, and financial analytics.

## Technical Stack

- **Framework**: Nuxt 3 (Vue 3) with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database & Auth**: Firebase (Firestore, Auth, Hosting) via VueFire
- **State Management**: Pinia with VueFire integration
- **PWA**: Service Worker with offline capabilities
- **Icons**: unplugin-icons with multiple icon sets (Mdi, Lucide, etc.)
- **Dates**: DayJS library (not native Date object)
- **Charts**: Chart.js for financial analytics
- **Notifications**: Vue3-Toastify for user feedback

## Core Architectural Principles

### 1. Dual Payment System Architecture
- **Axiom**: Two distinct payment types with unified interface
- **Recurrent Payments**: Template-based with automatic monthly instance generation
- **One-time Payments**: Direct payment records for current month
- Both types integrate seamlessly in summary and analytics views

### 2. Payment Instance Management
- **Axiom**: Recurrent payments generate individual instances per month
- Each instance tracks payment status independently
- Historical payment data maintained across months
- 6-month rolling view for comprehensive tracking

### 3. Real-time State Synchronization
- **Axiom**: All data changes sync immediately with Firebase
- Pinia stores cache data locally for performance
- VueFire provides reactive database bindings
- Optimistic updates for immediate UI feedback

### 4. Mobile-First Progressive Web App
- **Axiom**: Responsive design with mobile-first approach
- Installable PWA with offline capabilities
- Touch-friendly interface with large interaction targets
- Adaptive layouts (table view desktop, card view mobile)

### 5. Type-Safe Development Pattern
- **Axiom**: TypeScript throughout with comprehensive interface definitions
- Strongly typed Firebase operations
- Type-safe state management with Pinia
- Interface-driven component contracts

## Authentication & User Management

### Login Flow
- Entry point: Landing page with Google OAuth
- Firebase Authentication handles user sessions
- Auth middleware protects payment-related routes
- Post-login redirect to `/recurrent` dashboard

### User Context
- Single-user application (no multi-tenant architecture)
- User ID (`userId`) attached to all payment records
- Google profile information stored in user context
- Session management handled by Firebase Auth

## Project Structure

### Core Stores (Pinia)
- `stores/payment.ts` - One-time payment management
- `stores/recurrent.ts` - Recurring payment templates and instances
- `stores/index.ts` - Legacy store (being phased out)

### Page Structure
- `/` - Landing page with authentication
- `/recurrent/` - Main dashboard for recurring payments
- `/payments/` - One-time payments management
- `/summary/` - Financial analytics and reports

### Key Components
- `components/payments/` - One-time payment components
- `components/recurrents/` - Recurring payment components
- `components/ui/` - Shared UI components (modals, filters, loaders)

### Utilities & Configuration
- `interfaces/` - TypeScript type definitions
- `composables/` - Vue composition utilities
- `utils/` - Common utility functions
- `scripts/` - Database migration scripts

## Database Schema (Firestore)

### Core Collections

#### pt_payment (One-time Payments)
```
pt_payment/{document-id}/
  id: string                     // Document ID
  title: string                  // Payment description
  description: string            // Additional details
  amount: number                 // Payment amount
  category: string               // Payment category
  isPaid: boolean                // Payment status
  paidDate: Timestamp|null       // When payment was made
  recurrentId: string|null       // Link to recurrent template (if applicable)
  paymentType: string            // "one-time" or "recurrent"
  userId: string                 // User reference
  createdAt: Timestamp           // Creation timestamp
  dueDate: Timestamp|null        // When payment is due
```

#### pt_recurrent (Recurring Payment Templates)
```
pt_recurrent/{document-id}/
  id: string                     // Document ID
  title: string                  // Payment name
  description: string            // Payment description
  amount: number                 // Payment amount
  startDate: string              // When recurring payments begin
  dueDateDay: string             // Day of month payment is due
  endDate: string|null           // When recurring payments end (null = indefinite)
  timePeriod: string             // Frequency ("monthly", "yearly", etc.)
  category: string               // Payment category
  isCreditCard: boolean          // Credit card payment flag
  creditCardId: string|null      // Credit card reference
  userId: string                 // User reference
  createdAt: Timestamp           // Creation timestamp
```

### Legacy Collections (Migration Support)
- `payment` - Original payment structure (v1)
- `tracker` - Monthly payment tracking (deprecated)

## Payment Categories System

### Category Features
- Color-coded visual system
- Consistent across all payment types
- Used for analytics and filtering
- Customizable per user preference

## Key Features & Functionality

### Recurring Payment Management
- **Template Creation**: Define payment schedules and amounts
- **Instance Generation**: Automatic monthly payment creation
- **Status Tracking**: Individual payment status per month
- **6-Month View**: Rolling timeline of past and future payments
- **Bulk Operations**: Mark multiple payments as paid

### One-Time Payment Tracking
- **Current Month Focus**: Shows current month payments only
- **Quick Entry**: Fast payment creation and editing
- **Status Management**: Simple paid/unpaid toggling
- **Category Organization**: Visual grouping by payment type

### Financial Analytics & Summary
- **Interactive Charts**: Line charts for trends, pie charts for category distribution
- **Multi-Month Comparison**: Spending analysis across different periods
- **Key Metrics**: Total spend, average monthly cost, completion rates
- **Category Insights**: Detailed breakdown by spending category
- **Export Capabilities**: Data export for external analysis

### Progressive Web App Features
- **Offline Access**: Core functionality works without internet
- **App Installation**: Installable on mobile and desktop
- **Push Notifications**: Payment reminders and alerts (FCM)
- **Fast Loading**: Optimized performance with caching

## Data Migration & Legacy Support

### Migration Strategy
- **Scripts Directory**: Automated migration tools in `scripts/`
- **Version Compatibility**: Maintains support for legacy data
- **Progressive Migration**: Users can migrate at their own pace
- **Data Integrity**: Validation and backup during migration

### Database Evolution
- **V1 to V2 Migration**: From `payment` to `pt_payment` collection
- **Schema Improvements**: Better type safety and data structure
- **Performance Optimizations**: Indexed queries and efficient data access

## Development Guidelines

### Payment System Patterns
1. **Always distinguish between templates and instances**
2. **Use proper TypeScript interfaces for all data structures**
3. **Maintain real-time sync with Firebase**
4. **Implement optimistic updates for better UX**
5. **Handle offline scenarios gracefully**

### Component Development
1. **Follow composition API patterns**
2. **Use Pinia stores for state management**
3. **Implement proper loading states**
4. **Add toast notifications for user feedback (Vue3-Toastify)**
5. **Ensure mobile responsiveness**

### Data Management
1. **Validate data before Firebase operations**
2. **Use proper error handling and recovery**
3. **Implement proper TypeScript types**
4. **Cache frequently accessed data locally**
5. **Handle user authentication state changes**

## Localization & Language

### UI Language: Spanish Only
- **Axiom**: All user-facing text must be in Spanish
- No internationalization (i18n) framework - direct Spanish text in components
- HTML lang attribute set to `"es"` in `nuxt.config.ts`
- All labels, buttons, placeholders, messages, and notifications in Spanish

### Number & Currency Formatting
- **Axiom**: Use Argentine locale (`es-AR`) for all number formatting
- **Currency**: ARS (Argentine Pesos) as default (multi-currency support planned)
- **Decimal separator**: `,` (comma) - e.g., `$1.234,56`
- **Thousands separator**: `.` (period) - e.g., `$1.234,56`
- **Format function**: Always use `Intl.NumberFormat('es-AR', ...)` or `toLocaleString('es-AR', ...)`
- **CRITICAL**: Never hardcode `en-US` locale for number/currency formatting

### Amount Input Conversion
- **Display**: Uses comma (`,`) as decimal separator (e.g., `1234,56`)
- **Database**: Uses period (`.`) as decimal separator (e.g., `1234.56` stored as number)
- **Conversion functions** in payment forms:
  - `normalizeAmount()`: User input -> Display (period -> comma)
  - `parseAmount()`: Display -> Database (comma -> period)
  - `formatAmountForInput()`: Database -> Display (period -> comma)

### Date Formatting
- **Axiom**: Use Spanish locale with DayJS
- Configure DayJS with Spanish locale (`es`) in nuxt.config
- Use Spanish date format patterns (e.g., `D [de] MMMM [de] YYYY`)
- Month and day names must display in Spanish

### Formatting Utilities
All formatting should use centralized utilities in `utils/index.ts`:
```typescript
// Currency formatting - Argentine locale
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(price);
};

// Date formatting - Spanish locale
// Use $dayjs with Spanish locale configured
```

### Category Labels (Spanish)
- Vivienda y Alquiler (Housing & Rent)
- Servicios (Utilities)
- Supermercado (Groceries/Food)
- Salidas (Dining Out)
- Transporte (Transport)
- Entretenimiento (Entertainment)
- Salud (Health)
- Fitness y Deportes (Fitness & Sports)
- Cuidado Personal (Personal Care)
- Mascotas (Pet)
- Ropa (Clothes)
- Viajes (Traveling)
- Educacion (Education)
- Suscripciones (Subscriptions)
- Regalos (Gifts)
- Impuestos y Gobierno (Taxes & Government)
- Otros (Other)
