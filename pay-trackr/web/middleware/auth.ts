import { getCurrentUserAsync } from '~/utils/firebase';

export default defineNuxtRouteMiddleware(async (to, from) => {
    // If going to /welcome just continue
    // process.server should never be activated since ssr was set to false
    if(to.path.includes('/welcome') || process.server) return;

    const user = await getCurrentUserAsync();

    // If user exist then they can navigate to any page
    if (user) {
        return;
    } 

    // If going yo contact-us page, redirect to sign in page
    if(to.path.includes('/contact-us')) {
        return navigateTo({
            path: '/welcome',
            query: {
                redirect: to.fullPath,
            },
        })
    }

    // redirect the user to the login page if not signed in
    return navigateTo({
        path: '/',
    })
})