<template>
  <div class="transition-colors">
    <!-- Balance row (clickable header) -->
    <button
      @click="toggleExpand"
      class="w-full px-3 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left overflow-hidden"
      :class="{ 'bg-gray-50 dark:bg-gray-700/30': isExpanded }"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <!-- Chevron indicator -->
        <IconChevronRight
          class="w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0"
          :class="{ 'rotate-90': isExpanded }"
        />

        <!-- User avatar -->
        <UserAvatar
          :name="userName"
          :photo-url="null"
          size="sm"
          :variant="balance.net > 0 ? 'positive' : balance.net < 0 ? 'negative' : 'default'"
        />

        <!-- Name with (vos) marker -->
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ displayName }}
            <span v-if="isCurrentUser" class="text-gray-500 dark:text-gray-400 font-normal">
              (vos)
            </span>
          </p>
        </div>
      </div>

      <!-- Balance amount -->
      <div class="text-right flex-shrink-0">
        <AmountDisplay
          :amount="balance.net"
          :show-sign="true"
          :color-coded="true"
          size="sm"
          bold
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          <span v-if="balance.net > 0">le deben</span>
          <span v-else-if="balance.net < 0">debe</span>
          <span v-else>al dia</span>
        </p>
      </div>
    </button>

    <!-- Expanded breakdown -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-96"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-96"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="isExpanded"
        class="px-4 pb-3 overflow-hidden"
      >
        <div class="ml-7 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-2">
          <div
            v-for="(item, idx) in breakdown"
            :key="idx"
            class="flex items-center justify-between py-1.5 text-sm"
          >
            <div class="flex items-center gap-2 min-w-0">
              <CategoryIcon :category="item.expense.category" size="sm" />
              <span class="truncate text-gray-700 dark:text-gray-300">
                {{ item.expense.description }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                (pago {{ getFirstName(item.paidBy) }})
              </span>
            </div>
            <AmountDisplay
              :amount="item.amount"
              :show-sign="true"
              :color-coded="true"
              size="sm"
              class="flex-shrink-0 ml-2"
            />
          </div>
          <div v-if="breakdown.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">
            Sin gastos asociados
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import IconChevronRight from '~icons/mdi/chevron-right'

const props = defineProps({
  balance: { type: Object, required: true },
  breakdown: { type: Array, required: true },
  isCurrentUser: { type: Boolean, default: false }
})

const userStore = useUserStore()
const isExpanded = ref(false)

const userName = computed(() => {
  return userStore.getUserById(props.balance.userId)?.name || 'Usuario'
})

// Show first name only on mobile for better fit
const displayName = computed(() => {
  const name = userName.value
  return name.split(' ')[0]
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const getFirstName = (fullName) => {
  if (!fullName) return '?'
  return fullName.split(' ')[0]
}
</script>
