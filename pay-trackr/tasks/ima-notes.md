Architecture audit notes:

## 2. Business Logic Separation
### 🟠 HIGH - Server: All business logic in route handlers (monolith file)

Overkill separation. Files are not huge and we want to focus on delivering fast and testing product on real time scenarios, not perfect architecture

### 🟡 MEDIUM - Web: Pinia stores handle business logic well

Not an issue, seems like was something CC is saying is good? If it's suggesting to include a Domain architecture pattern, I'd not do that for a merge.

## 3. State Management (Pinia Stores)
### 🟡 MEDIUM - Stores are domain-organized but flat

Yes and we agree on separating stores into folder per project. I'd not do a shared folder now, I'd just do a clean separation between the 2 projects and, when necessary, start to create the shared folders progressively

### 🟡 MEDIUM - recurrent.ts mixes ODM and direct Firestore calls

Let's fix this one :)

## 4. TypeScript Usage
### 🟠 HIGH - Server is entirely vanilla JavaScript

Emmm, we could but we would be risking functionality for a start? I'd prioritize the merge and make it functional

### 🟠 HIGH - Excessive `any` types in web codebase (~45 instances)

Same as above. We could fix obvious one with CC

### 🟡 MEDIUM - 5x `@ts-ignore` in useToast.ts

Same as above

### 🟢 LOW - Unused Timestamp import

Let's clean up these

### 🟠 HIGH - Duplicate `Payment` interface definitions

Sip let's clean up these

### 🟡 MEDIUM - Disabled blog pages still in repo

Indeed not needed and won't work for us

### 🟡 MEDIUM - Legacy `stores/index.ts` referenced but doesn't exist

If true let's fix it

### 🟡 MEDIUM - Empty `plugins/` directory

Let's remove it

### 🟡 MEDIUM - Migration scripts in web package

We can remove these, I wonder if they will be useful in the future. If kept, I'd move them to the scripts folder and in case text the check also has it, I'd create separate script folders per project

### 🟡 MEDIUM - Legacy category utilities in utils/index.ts

Let's clean this up

### 🟡 MEDIUM - `validatePayment()` uses legacy schema

Clean up

### 🟢 LOW - Unused imports

Clean up

## 6. Error Handling

### 🟡 MEDIUM - Inconsistent error patterns across web stores

Interesting to define together, I did not think on any error management and will be interesting to create one if easier thinking that others users will use it. Otherwise would be overkill?

### 🟡 MEDIUM - Server error handling is better (Sentry) but verbose

Would not prioritize but fix if easy

### 🟢 LOW - `contact-us.vue` bare `console.error`

This was never functional, I would remove this page entirely and create a new contact us page. I'd do this on the merge, not in my repo, so after the merge

### 🟠 HIGH - Firebase config values hardcoded in nuxt.config.ts

Let's do it

### 🟡 MEDIUM - Hardcoded Firebase project ID fallback in server

yeaah do it ?

### 🟡 MEDIUM - Hardcoded Graph API version

Yes if you want, don't add any value IMO

### 🟡 MEDIUM - Hardcoded site URL in useSeo.ts

To clean up on the merge?

### 🟡 MEDIUM - Hardcoded Google Site Verification

Not sure what is this used for and why I added it. Let's investigate about this and clean it up properly

### 🟢 LOW - Hardcoded contact email fallback

Doesn't even exist that email. Let's create a new one and add it after the merge


## 8. Merge Blockers & Compatibility Issues
### 🔴 CRITICAL - firebase-admin and firebase-functions in web package.json

Let's remove them

### 🔴 CRITICAL - Duplicate Firebase initialization across 3 server files

I like this one, let's do it

### 🟠 HIGH - Firestore collection name conflicts with viaje-grupo

Let's fix these, but let's plan them together. I'd suggest a suffix per project so it's crystal clear what collection belongs to which project. Of course I'd do this after the merge

### 🟠 HIGH - No shared types between web and server

Love this one but would do it after the merge? This could be a code clean up project (separate after the merge)








