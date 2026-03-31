<template>
  <div class="min-h-screen bg-ttc-bg">
    <div class="container mx-auto px-4 py-12 max-w-3xl">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-ttc-text-muted hover:text-ttc-text transition-colors mb-8"
      >
        <ArrowLeft :size="20" :stroke-width="1.5" />
        Volver al inicio
      </NuxtLink>

      <h1 class="font-display text-3xl font-bold text-ttc-text mb-2">
        Preguntas frecuentes
      </h1>
      <p class="text-ttc-text-dim text-sm mb-10">
        Todo lo que necesitás saber sobre text the check
      </p>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-8">
        <div v-for="i in 3" :key="i" class="space-y-3">
          <div class="h-6 w-48 bg-ttc-surface rounded animate-pulse" />
          <div v-for="j in 3" :key="j" class="h-14 bg-ttc-surface rounded-lg animate-pulse" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-16">
        <p class="text-ttc-text-muted">No pudimos cargar las preguntas frecuentes.</p>
        <button
          class="mt-4 text-ttc-primary hover:text-ttc-primary-light transition-colors text-sm"
          @click="fetchFaq"
        >
          Reintentar
        </button>
      </div>

      <!-- FAQ content -->
      <div v-else class="space-y-10">
        <section v-for="group in groupedFaq" :key="group.topic">
          <h2 class="font-display text-lg font-semibold text-ttc-text mb-4">
            {{ group.topicLabel }}
          </h2>

          <div class="space-y-2">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="border border-ttc-border rounded-lg overflow-hidden"
            >
              <button
                class="w-full flex items-center justify-between px-5 py-4 text-left text-ttc-text hover:bg-ttc-surface/50 transition-colors"
                @click="toggle(item.id)"
              >
                <span class="font-medium text-sm pr-4">{{ item.question }}</span>
                <ChevronDown
                  :size="18"
                  :stroke-width="1.5"
                  class="shrink-0 text-ttc-text-muted transition-transform duration-200"
                  :class="{ 'rotate-180': openItems.has(item.id) }"
                />
              </button>

              <div
                v-show="openItems.has(item.id)"
                class="px-5 pb-5 faq-answer text-sm text-ttc-text-muted leading-relaxed"
                v-html="item.answer"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { collection, getDocs } from 'firebase/firestore'
import { ArrowLeft, ChevronDown } from 'lucide-vue-next'

definePageMeta({
  layout: 'landing',
  ssr: false,
})

useHead({
  title: 'Preguntas frecuentes — text the check',
})

useSeoMeta({
  title: 'Preguntas frecuentes — text the check',
  description: 'Preguntas frecuentes sobre text the check. Cómo dividir gastos con amigos, vincular WhatsApp y más.',
  ogTitle: 'Preguntas frecuentes — text the check',
  ogDescription: 'Preguntas frecuentes sobre text the check. Cómo dividir gastos con amigos, vincular WhatsApp y más.',
})

const { db } = useFirebase()
const loading = ref(true)
const error = ref(false)
const faqItems = ref([])
const openItems = ref(new Set())

const groupedFaq = computed(() => {
  const groups = new Map()

  for (const item of faqItems.value) {
    if (!groups.has(item.topic)) {
      groups.set(item.topic, {
        topic: item.topic,
        topicLabel: item.topicLabel,
        topicOrder: item.topicOrder,
        items: [],
      })
    }
    groups.get(item.topic).items.push(item)
  }

  const sorted = Array.from(groups.values()).sort((a, b) => a.topicOrder - b.topicOrder)
  for (const group of sorted) {
    group.items.sort((a, b) => a.order - b.order)
  }
  return sorted
})

function toggle(id) {
  if (openItems.value.has(id)) {
    openItems.value.delete(id)
  } else {
    openItems.value.add(id)
  }
}

async function fetchFaq() {
  loading.value = true
  error.value = false

  try {
    const snapshot = await getDocs(collection(db, 'ttc_faq'))

    faqItems.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (e) {
    console.error('Error fetching FAQ:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFaq()
})
</script>

<style scoped>
.faq-answer :deep(p) {
  margin-bottom: 0.75rem;
}
.faq-answer :deep(p:last-child) {
  margin-bottom: 0;
}
.faq-answer :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}
.faq-answer :deep(li) {
  margin-bottom: 0.25rem;
}
.faq-answer :deep(strong) {
  color: var(--color-text);
}
.faq-answer :deep(a) {
  color: var(--color-primary);
  transition: color 0.15s;
}
.faq-answer :deep(a:hover) {
  color: var(--color-primary-light);
}
.faq-answer :deep(code) {
  background: var(--color-surface);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
  color: var(--color-text);
}
</style>
