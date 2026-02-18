<template>
  <div class="whatsapp-page mb-8">
    <!-- Settings Navigation -->
    <SettingsNav />

    <div class="flex flex-col gap-6 px-3">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-left">WhatsApp</h1>
          <p class="text-gray-400 text-sm mt-1">Vincula tu WhatsApp para registrar gastos por mensaje</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col gap-4 skeleton-shimmer">
        <div class="h-48 w-full bg-gray-700 rounded-xl"></div>
      </div>

      <!-- Linked Account -->
      <div v-else-if="linkedAccount" class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <MdiWhatsapp class="text-2xl text-green-500" />
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-green-400">Cuenta Vinculada</h2>
            <p class="text-gray-400 mt-1">
              Numero: <span class="text-white font-mono">+{{ formatPhoneNumber(linkedAccount.phoneNumber) }}</span>
            </p>
            <p class="text-gray-500 text-sm mt-1">
              Vinculado: {{ formatDate(linkedAccount.linkedAt) }}
            </p>
          </div>
        </div>

        <div class="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 class="font-medium mb-2">Como registrar gastos:</h3>
          <p class="text-gray-400 text-sm">
            Envia un mensaje al numero de WhatsApp con el formato:
          </p>
          <div class="mt-3 space-y-2">
            <code class="block bg-gray-800 px-3 py-2 rounded text-sm text-green-400">$500 super</code>
            <code class="block bg-gray-800 px-3 py-2 rounded text-sm text-green-400">1500 almuerzo</code>
            <code class="block bg-gray-800 px-3 py-2 rounded text-sm text-green-400">$2000 uber</code>
          </div>
        </div>

        <button
          @click="confirmUnlink"
          class="mt-6 btn btn-danger w-full flex items-center justify-center gap-2"
        >
          <MdiLinkOff />
          Desvincular Cuenta
        </button>
      </div>

      <!-- Not Linked - Generate Code -->
      <div v-else class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
            <MdiWhatsapp class="text-2xl text-gray-400" />
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-semibold">Vincular WhatsApp</h2>
            <p class="text-gray-400 mt-1">
              Vincula tu numero de WhatsApp para registrar gastos enviando mensajes.
            </p>
          </div>
        </div>

        <!-- Code Display -->
        <div v-if="pendingCode" class="mt-6">
          <div class="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <p class="text-sm text-gray-300 mb-3">
              Envia este mensaje al numero <span class="font-semibold text-white">+1 555 151 8420</span>:
            </p>
            <div class="flex items-center gap-3">
              <code class="flex-1 bg-gray-800 px-4 py-3 rounded-lg text-xl font-mono text-primary tracking-wider">
                VINCULAR {{ pendingCode }}
              </code>
              <button
                @click="copyCode"
                class="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Copiar"
              >
                <MdiContentCopy v-if="!copied" />
                <MdiCheck v-else class="text-green-400" />
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-3">
              El codigo expira en {{ timeRemaining }}
            </p>
          </div>

          <button
            @click="generateCode"
            :disabled="isGenerating"
            class="mt-4 btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <MdiRefresh :class="{ 'animate-spin': isGenerating }" />
            Generar Nuevo Codigo
          </button>
        </div>

        <!-- Generate Code Button -->
        <button
          v-else
          @click="generateCode"
          :disabled="isGenerating"
          class="mt-6 btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <MdiLoading v-if="isGenerating" class="animate-spin" />
          <MdiQrcode v-else />
          Generar Codigo de Vinculacion
        </button>
      </div>

      <!-- Instructions -->
      <div class="bg-base rounded-xl border border-gray-600 shadow-sm shadow-white/5 p-6">
        <h3 class="font-semibold mb-4 flex items-center gap-2">
          <MdiInformation class="text-primary" />
          Como funciona
        </h3>
        <ol class="space-y-3 text-gray-400 text-sm">
          <li class="flex gap-3">
            <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">1</span>
            <span>Genera un codigo de vinculacion desde esta pagina</span>
          </li>
          <li class="flex gap-3">
            <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">2</span>
            <span>Envia el codigo al numero de WhatsApp de PayTrackr</span>
          </li>
          <li class="flex gap-3">
            <span class="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">3</span>
            <span>Una vez vinculado, podes enviar gastos como "$500 super" y se registraran automaticamente</span>
          </li>
        </ol>

        <div class="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p class="text-yellow-400 text-sm flex items-start gap-2">
            <MdiAlert class="shrink-0 mt-0.5" />
            <span>El codigo expira en 10 minutos. Si no lo usas a tiempo, genera uno nuevo.</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Unlink Confirmation -->
    <ConfirmDialogue
      ref="unlinkConfirm"
      message="Estas seguro de que queres desvincular tu WhatsApp? Ya no podras registrar gastos por mensaje."
      textCancelButton="Cancelar"
      textConfirmButton="Si, desvincular"
      @confirm="unlinkAccount"
    />
  </div>
</template>

<script setup>
import MdiWhatsapp from '~icons/mdi/whatsapp';
import MdiLinkOff from '~icons/mdi/link-off';
import MdiQrcode from '~icons/mdi/qrcode';
import MdiContentCopy from '~icons/mdi/content-copy';
import MdiCheck from '~icons/mdi/check';
import MdiRefresh from '~icons/mdi/refresh';
import MdiLoading from '~icons/mdi/loading';
import MdiInformation from '~icons/mdi/information';
import MdiAlert from '~icons/mdi/alert';

definePageMeta({
  middleware: ['auth']
});

// ----- Store ---------
const whatsappStore = useWhatsappStore();
const { linkedAccount, pendingCode, codeExpiresAt, isLoading, isGenerating } = storeToRefs(whatsappStore);

// ----- Composables ---------
const { $dayjs } = useNuxtApp();

// ----- Refs ---------
const unlinkConfirm = ref(null);
const timeRemaining = ref('10:00');
const copied = ref(false);

let countdownInterval = null;

// ----- Methods ---------
async function generateCode() {
  const result = await whatsappStore.generateCode();

  if (result.success) {
    startCountdown();
    useToast('success', 'Codigo generado correctamente');
  } else {
    useToast('error', result.error || 'Error al generar el codigo');
  }
}

function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    if (!codeExpiresAt.value) {
      clearInterval(countdownInterval);
      return;
    }

    const now = new Date();
    const diff = codeExpiresAt.value.getTime() - now.getTime();

    if (diff <= 0) {
      whatsappStore.clearPendingCode();
      timeRemaining.value = '00:00';
      clearInterval(countdownInterval);
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    timeRemaining.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

async function copyCode() {
  if (!pendingCode.value) return;

  try {
    await navigator.clipboard.writeText(`VINCULAR ${pendingCode.value}`);
    copied.value = true;
    useToast('success', 'Codigo copiado');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    useToast('error', 'Error al copiar');
  }
}

function confirmUnlink() {
  unlinkConfirm.value.open();
}

async function unlinkAccount() {
  const success = await whatsappStore.unlinkAccount();

  if (success) {
    useToast('success', 'Cuenta desvinculada correctamente');
  } else {
    useToast('error', whatsappStore.error || 'Error al desvincular la cuenta');
  }
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return $dayjs(date).format('D [de] MMMM [de] YYYY, HH:mm');
}

// ----- Lifecycle ---------
onMounted(async () => {
  await whatsappStore.fetchLinkedAccount();

  // Restore pending code if exists
  const pendingResult = await whatsappStore.fetchPendingCode();
  if (pendingResult.success) {
    startCountdown();
  }

  whatsappStore.subscribeToChanges();
});

onUnmounted(() => {
  whatsappStore.unsubscribe();
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

// ----- Meta ---------
useSeo({
  title: 'WhatsApp - PayTrackr',
  description: 'Vincula tu WhatsApp para registrar gastos',
  path: '/settings/whatsapp',
  noindex: true,
});
</script>

