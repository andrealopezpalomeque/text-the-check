<template>
    <div class="max-w-[80rem] px-[1.429rem] mx-auto">
        <form v-if="!sending" @submit.prevent="sendContactUsMessage()" class="mt-2 flex flex-col gap-[1rem]">
            <div class="flex flex-col gap-[0.571rem]">
                <label>Nombre Completo *</label>
                <input class="form-input" disabled placeholder="Tu nombre completo" v-model="contactUs.fullName" required name="title" autocomplete="off" />
            </div>
            <div class="flex flex-col gap-[0.571rem]">
                <label>Email *</label>
                <input class="form-input" disabled placeholder="Tu email" type="email" v-model="contactUs.email" required name="title" autocomplete="off" />
            </div>
            <div class="flex flex-col gap-[0.571rem]">
                <label>Mensaje *</label>
                <textarea required v-model="contactUs.message" name="message" autocomplete="off" class="min-h-20 pt-4 form-input" />
            </div>
            <input class="btn btn-primary" :disabled="disableButton" type="submit" value="Enviar">
        </form>
        <div v-else class="flex justify-center m-10 p-10">
            <Loader size="10" />
        </div>
    </div>
</template>

<script setup>
import { collection, addDoc } from 'firebase/firestore';
import { getCurrentUser, getFirestoreInstance } from '~/utils/firebase';


definePageMeta({
    layout: 'contact-us',
    middleware: 'auth'
})

const user = getCurrentUser()
const db = getFirestoreInstance();

const contactUs = ref({
    fullName: user?.displayName || '',
    email: user?.email || '',
    message: '',
})
const disableButton = ref(false)
const sending = ref(false)

// ----- Define Methods --------
async function sendContactUsMessage() {
    disableButton.value = true;
    sending.value = true;

    // Simple validate name and full name and the message is not empty
    if(contactUs.value.fullName !== user?.displayName) {
        useToast("error", "El nombre no coincide con tu cuenta.")
        disableButton.value = false;
        sending.value = false;
        return;
    } else if(contactUs.value.email !== user?.email) {
        useToast("error", "El email no coincide con tu cuenta.")
        disableButton.value = false;
        sending.value = false;
        return;
    } else if(contactUs.value.message.length == 0) {
        useToast("error", "Por favor agregá un mensaje.")
        disableButton.value = false;
        sending.value = false;
        return;
    }

    try {
        // Send message to firebase
        // Post tracker object on Firestore
        const newContactUs = await addDoc(collection(db, "contactUs"), contactUs.value);

        // Show success message and redirect to home page
        useToast("success", "¡Gracias! Mensaje enviado correctamente.", { onClick: "goHome", autoClose: 2000 })
        setTimeout(() => {
            navigateTo("/")
        }, 2000)
    } catch (error) {
        console.error(error)
        useToast("error", "Algo salió mal. Por favor intentá de nuevo más tarde.")
        disableButton.value = false;
        sending.value = false;
    }

}
useSeo({
  title: 'Contacto - PayTrackr',
  description: 'Escribinos para darnos tu opinión o cualquier recomendación.',
  path: '/contact-us',
  noindex: true,
})
</script>
