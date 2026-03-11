# UI Redesign — Visual Consistency Pass Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a consistent visual design language across both app modes (Grupos + Finanzas): left color-bar cards, unified modal frames, consistent page headers, and clean stat pills.

**Architecture:** Targeted, surgical edits to existing components — no new files, no structural refactors. Each task modifies 1–2 files independently. All functionality (event handlers, v-models, store interactions, navigation) must remain untouched.

**Tech Stack:** Nuxt 3 SPA, Vue 3 Composition API, Tailwind CSS (`ttc-*` CSS variables), MDI icons via `~icons/mdi/*`, existing `Modal.vue` wrapper component.

---

## Scope Notes (Important)

Before touching anything, understand these constraints:

- **No emojis exist in the dashboard** — CategoryIcon already uses MDI icons in colored circles. The spec mentioned emoji removal but it's already done. Skip that.
- **The `Modal.vue` wrapper already handles the X button** — When using the `#header` slot, don't add another close button.
- **The `Modal.vue` wrapper already handles header/body/footer borders** — `border-b` on header, `border-t` on footer are built in.
- **Category colors in Grupos are static** (food/transport/accommodation/entertainment/shopping/general). In Finanzas they come from `categoryStore.getCategoryColor(categoryId)`.

---

## File Map

| File | Change |
|------|--------|
| `client/components/grupos/expense/ExpenseItem.vue` | Replace CategoryIcon circle with 4px left color bar + category pill |
| `client/pages/finanzas/pagos-unicos.vue` | Add left color bar to grid cards, replace status icon box with text badge |
| `client/components/finanzas/payments/PaymentsManagePayment.vue` | Simplify complex modal header to plain title |
| `client/components/grupos/expense/ExpenseModal.vue` | Unify label color to `text-ttc-text-muted` |
| `client/pages/finanzas/index.vue` | Stat pills redesign + page header font-weight |
| `client/pages/finanzas/pagos-unicos.vue` | Stat pills redesign (same file as above card change) |
| `client/components/grupos/navigation/BottomNav.vue` | FAB hover/active state consistency |
| `client/components/finanzas/FinanzasBottomNav.vue` | FAB hover/active state consistency |

---

## Chunk 1: Cards

### Task 1: ExpenseItem — Left Color Bar

**Files:**
- Modify: `client/components/grupos/expense/ExpenseItem.vue`

**Current:** Uses `<CategoryIcon :category="expense.category" size="md" />` — a 40px rounded-xl colored circle with an icon inside.

**Target:** 4px left color bar (category color) + small category pill tag next to the title. Remove CategoryIcon entirely.

Category color map to use:
```js
const categoryColors = {
  food: '#F97316',
  transport: '#3B82F6',
  accommodation: '#A855F7',
  entertainment: '#EC4899',
  shopping: '#10B981',
  general: '#6B7280'
}

const categoryNames = {
  food: 'Comida',
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  entertainment: 'Entretenimiento',
  shopping: 'Compras',
  general: 'Otro'
}
```

- [ ] **Step 1: Read the file**

```bash
cat client/components/grupos/expense/ExpenseItem.vue
```

- [ ] **Step 2: Replace the template**

Replace the outer `<div class="px-3 py-3 hover:bg-ttc-card-hover ...">` wrapper with a version that has a left color bar:

```vue
<template>
  <div
    class="relative flex items-start gap-2 py-3 pr-3 pl-4 hover:bg-ttc-card-hover transition-colors overflow-hidden"
  >
    <!-- Left color bar (4px, full height) -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
      :style="{ backgroundColor: categoryColor }"
    />

    <!-- Main content -->
    <div class="flex-1 min-w-0">
      <!-- Description and amount row -->
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <!-- Title + category pill -->
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-medium text-ttc-text truncate">
              {{ expense.description }}
            </p>
            <span
              class="text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0"
              :style="{ backgroundColor: categoryColor + '26', color: categoryColor }"
            >
              {{ categoryName }}
            </span>
          </div>
          <p class="text-xs text-ttc-text-muted mt-0.5">
            Pago: <span class="font-medium">{{ expense.userName }}</span>
            <span class="mx-1">-</span>
            <span>{{ formatRelativeTime(expense.timestamp) }}</span>
          </p>
        </div>

        <!-- Amount and actions (unchanged) -->
        <div class="flex items-start gap-2">
          <div class="flex items-center gap-0.5">
            <button
              @click.stop="$emit('edit', expense)"
              class="p-1.5 text-ttc-text-dim hover:text-ttc-primary active:text-ttc-primary hover:bg-blue-900/20 active:bg-blue-900/30 rounded-lg transition-colors"
              title="Editar gasto"
            >
              <IconPencil class="w-4 h-4" />
            </button>
            <button
              @click.stop="$emit('delete', expense)"
              class="p-1.5 text-ttc-text-dim hover:text-red-400 active:text-red-400 hover:bg-red-900/20 active:bg-red-900/30 rounded-lg transition-colors"
              title="Eliminar gasto"
            >
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <div class="text-right flex-shrink-0">
            <template v-if="showUserShare && userShare > 0">
              <p class="text-sm font-semibold text-ttc-text font-mono tabular-nums whitespace-nowrap">
                {{ formatCurrency(userShare) }}
              </p>
              <p class="text-xs text-ttc-text-muted whitespace-nowrap">tu parte</p>
            </template>
            <template v-else>
              <AmountDisplay :amount="expense.amount" size="sm" bold />
              <p
                v-if="expense.originalCurrency && expense.originalCurrency !== 'ARS'"
                class="text-xs text-ttc-text-muted whitespace-nowrap"
              >
                {{ formatCurrencyByCode(expense.originalAmount ?? 0, expense.originalCurrency) }}
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- Participants info (unchanged) -->
      <div class="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs">
        <span class="text-ttc-text-muted">
          Dividido entre:
          <span class="text-ttc-text">{{ participantsDisplay }}</span>
        </span>
        <span class="text-ttc-text-muted bg-ttc-input px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          {{ formatCurrency(perPersonAmount) }} c/u
        </span>
      </div>
    </div>
  </div>
</template>
```

Add computed properties to `<script setup>`:
```js
const categoryColors = {
  food: '#F97316',
  transport: '#3B82F6',
  accommodation: '#A855F7',
  entertainment: '#EC4899',
  shopping: '#10B981',
  general: '#6B7280'
}

const categoryNames = {
  food: 'Comida',
  transport: 'Transporte',
  accommodation: 'Alojamiento',
  entertainment: 'Entretenimiento',
  shopping: 'Compras',
  general: 'Otro'
}

const categoryColor = computed(() => categoryColors[props.expense.category] ?? categoryColors.general)
const categoryName = computed(() => categoryNames[props.expense.category] ?? 'Otro')
```

Remove the `CategoryIcon` import (it's no longer used).

- [ ] **Step 3: Verify**

Check that `CategoryIcon` is no longer imported or used in `ExpenseItem.vue`. Check that `formatRelativeTime`, `formatCurrency`, `formatCurrencyByCode` are still used/available (they come from auto-imported composables — don't add manual imports for these).

- [ ] **Step 4: Commit**

```bash
git add client/components/grupos/expense/ExpenseItem.vue
git commit -m "feat: replace CategoryIcon with left color bar in ExpenseItem"
```

---

### Task 2: Pagos Únicos — Left Color Bar on Cards

**Files:**
- Modify: `client/pages/finanzas/pagos-unicos.vue` (lines ~119–210, the payment card section)

**Current:** Grid card (`rounded-xl p-4 bg-ttc-surface`) with a status icon (check/clock/circle) in a `h-10 w-10 rounded-xl` box at top-right.

**Target:** Same card structure but with:
- `overflow-hidden` + absolute left color bar (4px, category color)
- Status as a text badge (pill) below the title instead of the top-right icon box
- `pl-5` instead of `p-4` to accommodate the left bar
- Keep amount, date, and category pill unchanged

Status badge mapping:
- `isPaid` → `"Pagado"` in success green (`bg-success/15 text-success`)
- `!isPaid && isDelayed(dueDate)` → `"Vencido"` in danger red (`bg-danger/15 text-danger`)
- `!isPaid && isNextWeek(dueDate)` → `"Próximo: {date}"` in warning amber (`bg-warning/15 text-warning`)
- Otherwise → `"Pendiente"` in muted (`bg-ttc-input text-ttc-text-muted`)

The `isNextWeek` check: `dayjs(dueDate?.toDate()).diff(dayjs(), 'day') <= 7 && dayjs(dueDate?.toDate()).diff(dayjs(), 'day') >= 0`

- [ ] **Step 1: Read the full payment card section** (lines ~119–215)

- [ ] **Step 2: Replace the card template**

Target for each payment card:

```vue
<div
  v-for="payment in payments"
  :key="payment.id"
  class="relative rounded-xl pl-5 pr-4 py-4 bg-ttc-surface cursor-pointer transition-all duration-200 border border-ttc-border shadow-sm hover:shadow-md overflow-hidden"
  @click="showDetails(payment.id)"
>
  <!-- Left color bar -->
  <div
    class="absolute left-0 top-0 bottom-0 w-1"
    :style="{ backgroundColor: getDisplayCategoryColor(payment) }"
  />

  <!-- Card Header: Title + WhatsApp/Revision badges + Status badge -->
  <div class="flex items-start justify-between mb-2">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="font-semibold text-ttc-text truncate">{{ payment.title }}</h3>
        <span
          v-if="payment.isWhatsapp"
          class="flex-shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400"
          :title="getSourceLabel(payment)"
        >
          <component :is="getSourceIcon(payment)" class="text-xs" />
        </span>
        <span
          v-if="payment.needsRevision"
          class="flex-shrink-0 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400"
          title="Necesita revision"
        >
          <MdiAlertCircleOutline class="text-xs" />
          Revisar
        </span>
      </div>
      <!-- Category pill -->
      <span
        class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md tracking-wide font-medium"
        :style="{ backgroundColor: getDisplayCategoryColor(payment) + '20', color: getDisplayCategoryColor(payment) }"
      >
        {{ getDisplayCategoryName(payment) }}
      </span>
    </div>
    <!-- Status badge (top-right) -->
    <span class="ml-2 flex-shrink-0 text-[10px] px-2 py-0.5 rounded-md font-medium"
      :class="getStatusBadgeClass(payment)"
    >
      {{ getStatusBadgeText(payment) }}
    </span>
  </div>

  <!-- Description (unchanged) -->
  <p v-if="payment.description" class="text-xs text-ttc-text-muted line-clamp-1 mb-3">
    {{ payment.description }}
  </p>

  <!-- Amount & Date (unchanged) -->
  <div class="flex justify-between items-end mb-4">
    ...keep existing amount/date markup...
  </div>

  <!-- Footer (unchanged) -->
  ...keep existing footer markup...
</div>
```

Add to `<script setup>`:
```js
function getStatusBadgeClass(payment) {
  const { $dayjs } = useNuxtApp()
  if (payment.isPaid) return 'bg-success/15 text-ttc-success'
  const daysUntil = payment.dueDate
    ? $dayjs(payment.dueDate.toDate()).diff($dayjs(), 'day')
    : null
  if (daysUntil !== null && daysUntil < 0) return 'bg-danger/15 text-ttc-danger'
  if (daysUntil !== null && daysUntil <= 7) return 'bg-warning/15 text-ttc-warning'
  return 'bg-ttc-input text-ttc-text-muted'
}

function getStatusBadgeText(payment) {
  const { $dayjs } = useNuxtApp()
  if (payment.isPaid) return 'Pagado'
  const daysUntil = payment.dueDate
    ? $dayjs(payment.dueDate.toDate()).diff($dayjs(), 'day')
    : null
  if (daysUntil !== null && daysUntil < 0) return 'Vencido'
  if (daysUntil !== null && daysUntil <= 7) {
    const formatted = $dayjs(payment.dueDate.toDate()).format('D MMM')
    return `Próximo: ${formatted}`
  }
  return 'Pendiente'
}
```

Remove `MdiCheck`, `MdiClockOutline`, `MdiCircleOutline` imports if no longer used elsewhere in the page.

- [ ] **Step 3: Verify**

Check that `isDelayed()` function is still being used somewhere OR that you've replaced all its usages. Check that the `getSourceIcon` and `getSourceLabel` functions still exist. Do NOT remove `MdiAlertCircleOutline` — it's still used for the revision badge.

- [ ] **Step 4: Commit**

```bash
git add client/pages/finanzas/pagos-unicos.vue
git commit -m "feat: replace status icon box with left color bar and text badge in pagos-unicos cards"
```

---

## Chunk 2: Modals

### Task 3: PaymentsManagePayment — Simplify Modal Header

**Files:**
- Modify: `client/components/finanzas/payments/PaymentsManagePayment.vue`

**Current `#header` slot:** Complex div with loading color bar, h2, subtitle, WhatsApp/created-count indicators.

**Target:** Simple title-only header. The `Modal.vue` wrapper already adds the X button. Move the "N pagos creados" feedback to the body (a small inline toast after form submit), or simply display it as a subtle status below the form. But DO NOT remove the `paymentsCreatedCount` behavior — just move its display.

- [ ] **Step 1: Read the header slot (lines ~4–27)**

- [ ] **Step 2: Replace the #header slot**

```vue
<template #header>
  <h2 class="font-display text-base font-semibold text-ttc-text">
    {{ props.isReview ? "Revisar" : (isEdit ? "Editar" : "Crear") }} Pago {{ isRecurrent ? "Fijo" : "Único" }}
  </h2>
</template>
```

- [ ] **Step 3: Move the "N pagos creados" indicator**

In the form body, find where to add the created-count feedback. Add this ABOVE the quick templates section (or below the title field):

```vue
<!-- Created count feedback -->
<div v-if="paymentsCreatedCount > 0 && !isEdit"
     class="flex items-center gap-2 text-xs text-ttc-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
  <MdiCheck class="text-sm flex-shrink-0" />
  {{ paymentsCreatedCount }} {{ paymentsCreatedCount === 1 ? 'pago creado' : 'pagos creados' }}
</div>
```

Also add the WhatsApp indicator there:
```vue
<div v-if="props.isReview"
     class="flex items-center gap-2 text-xs text-ttc-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
  <span class="inline-block w-2 h-2 rounded-full bg-ttc-success flex-shrink-0"></span>
  Creado via WhatsApp
</div>
```

- [ ] **Step 4: Verify**

Check that `paymentsCreatedCount`, `isEdit`, `isRecurrent`, `props.isReview` are still correctly used. The `isSubmitting` loading state in the form should still work. Run through the modal open/close logic mentally.

- [ ] **Step 5: Commit**

```bash
git add client/components/finanzas/payments/PaymentsManagePayment.vue
git commit -m "feat: simplify PaymentsManagePayment modal header to plain title"
```

---

### Task 4: ExpenseModal — Unify Label Styling

**Files:**
- Modify: `client/components/grupos/expense/ExpenseModal.vue`

**Current:** Labels use `text-sm font-medium text-ttc-text mb-1`.

**Target:** Labels should use `text-sm font-medium text-ttc-text-muted mb-1.5` (matching the finanzas modals and the spec: `text-ttc-text-muted`).

This is a small, focused change — just the label color.

- [ ] **Step 1: Replace all label classes in the file**

Find all occurrences of `class="block text-sm font-medium text-ttc-text mb-1"` and replace with `class="block text-sm font-medium text-ttc-text-muted mb-1.5"`. There are ~5 labels.

- [ ] **Step 2: Commit**

```bash
git add client/components/grupos/expense/ExpenseModal.vue
git commit -m "style: unify ExpenseModal label color to text-ttc-text-muted"
```

---

## Chunk 3: Stats + Navigation

### Task 5: Summary Stats Pills — Finanzas Pages

**Files:**
- Modify: `client/pages/finanzas/pagos-unicos.vue` (same file, already touched in Task 2)
- Modify: `client/pages/finanzas/index.vue`

**Current stat row pattern** (both pages):
```vue
<div class="flex items-center gap-3">
  <MdiCashCheck class="text-success text-2xl" />
  <span class="text-lg font-semibold text-ttc-text font-mono tabular-nums">{{ formatPrice(X) }}</span>
</div>
```

**Target stat pill pattern:**
```vue
<div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
  <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-success"></span>
  <span class="text-[10px] text-ttc-text-muted">Pagado</span>
  <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(X) }}</span>
</div>
```

Three pills per page:
1. **Pagado** — green dot (`bg-ttc-success`)
2. **Pendiente** — red dot (`bg-ttc-danger`)
3. **Total** — primary dot (`bg-ttc-primary`)

- [ ] **Step 1: Update pagos-unicos.vue Summary Stats section (lines ~82–98)**

Replace the `<div class="flex flex-wrap gap-4 md:gap-6">` block with:

```vue
<div class="flex flex-wrap gap-2">
  <div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-success"></span>
    <span class="text-[10px] text-ttc-text-muted">Pagado</span>
    <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(monthTotals.paid) }}</span>
  </div>
  <div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-danger"></span>
    <span class="text-[10px] text-ttc-text-muted">Pendiente</span>
    <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(monthTotals.unpaid) }}</span>
  </div>
  <div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-primary"></span>
    <span class="text-[10px] text-ttc-text-muted">Total</span>
    <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(monthTotals.paid + monthTotals.unpaid) }}</span>
  </div>
</div>
```

Remove `MdiCashCheck`, `MdiCashRemove`, `MdiCalculator` imports IF they're no longer used anywhere else in the file.

- [ ] **Step 2: Update finanzas/index.vue Summary Stats section (lines ~72–88)**

Same pill pattern. Variable names are `currentMonthTotals.paid`, `currentMonthTotals.unpaid`:

```vue
<div class="flex flex-wrap gap-2">
  <div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-success"></span>
    <span class="text-[10px] text-ttc-text-muted">Pagado</span>
    <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(currentMonthTotals.paid) }}</span>
  </div>
  <div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-danger"></span>
    <span class="text-[10px] text-ttc-text-muted">Pendiente</span>
    <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(currentMonthTotals.unpaid) }}</span>
  </div>
  <div class="flex items-center gap-1.5 bg-ttc-card border border-ttc-border rounded-lg px-3 py-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 bg-ttc-primary"></span>
    <span class="text-[10px] text-ttc-text-muted">Total</span>
    <span class="text-sm font-semibold text-ttc-text font-mono tabular-nums ml-1">{{ formatPrice(currentMonthTotals.paid + currentMonthTotals.unpaid) }}</span>
  </div>
</div>
```

Remove `MdiCashCheck`, `MdiCashRemove`, `MdiCalendarMonth` imports if no longer used elsewhere.

- [ ] **Step 3: Commit**

```bash
git add client/pages/finanzas/pagos-unicos.vue client/pages/finanzas/index.vue
git commit -m "feat: replace icon+amount stats with pill style in finanzas pages"
```

---

### Task 6: Page Headers — Font Weight

**Files:**
- Modify: `client/pages/finanzas/index.vue`
- Modify: `client/pages/finanzas/pagos-unicos.vue`

**Current:** `font-display text-2xl font-bold`
**Target:** `font-display text-2xl font-extrabold`

- [ ] **Step 1: Update finanzas/index.vue**

Find `<h1 class="font-display text-2xl font-bold">Pagos Fijos</h1>` → change `font-bold` to `font-extrabold`.

- [ ] **Step 2: Update pagos-unicos.vue**

Find `<h1 class="font-display text-2xl font-bold">Pagos Únicos</h1>` → change `font-bold` to `font-extrabold`.

- [ ] **Step 3: Commit**

```bash
git add client/pages/finanzas/index.vue client/pages/finanzas/pagos-unicos.vue
git commit -m "style: change finanzas page header to font-extrabold"
```

---

### Task 7: FAB Button Consistency

**Files:**
- Modify: `client/components/grupos/navigation/BottomNav.vue`
- Modify: `client/components/finanzas/FinanzasBottomNav.vue`

**Current inconsistency:**
- BottomNav FAB: `hover:bg-ttc-primary/90 active:bg-ttc-primary/80`
- FinanzasBottomNav FAB: `hover:bg-ttc-primary-light active:bg-ttc-primary`

**Target:** Both use `hover:bg-ttc-primary/90 active:bg-ttc-primary/80`.

- [ ] **Step 1: Update FinanzasBottomNav.vue**

Find the FAB div: `class="w-14 h-14 bg-ttc-primary hover:bg-ttc-primary-light active:bg-ttc-primary rounded-full ..."`

Change to: `class="w-14 h-14 bg-ttc-primary hover:bg-ttc-primary/90 active:bg-ttc-primary/80 rounded-full ..."`

- [ ] **Step 2: Commit**

```bash
git add client/components/finanzas/FinanzasBottomNav.vue
git commit -m "style: unify FAB button hover/active states across bottom navs"
```

---

## Post-Implementation Checklist

After all tasks are complete:

- [ ] Review each modified file to ensure v-models, event emitters, and store interactions are unchanged
- [ ] Check that all removed icon imports are actually no longer used (grep for them in their file)
- [ ] Verify that `categoryColor + '26'` hex math works (26 is 15% opacity in hex — matches the spec's "15% opacity")
- [ ] Check that `RecurrentsManagePayment.vue` header is already acceptable (it is: `<h2 class="text-xl font-bold">` — no changes needed since it has no complex structure)
- [ ] Note any decisions that need review in the PR description
