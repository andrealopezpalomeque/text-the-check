/**
 * ESM Loader Hook — redirects imports to mocks at resolve time.
 *
 * Intercepts:
 *   config/firebase      → mocks/firebase.ts
 *   firebase-admin       → mocks/firebase.ts
 *   firebase-admin/*     → mocks/firebase.ts
 *   helpers/whatsapp     → mocks/whatsapp.ts
 *   @sentry/node         → mocks/sentry.ts
 */

import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mocksDir = path.join(__dirname, 'mocks')

const firebaseMock = pathToFileURL(path.join(mocksDir, 'firebase.ts')).href
const whatsappMock = pathToFileURL(path.join(mocksDir, 'whatsapp.ts')).href
const sentryMock = pathToFileURL(path.join(mocksDir, 'sentry.ts')).href

export function resolve(
  specifier: string,
  context: { parentURL?: string; conditions?: string[] },
  nextResolve: Function,
) {
  // config/firebase (local project import)
  if (specifier.includes('config/firebase')) {
    return { url: firebaseMock, shortCircuit: true, format: undefined }
  }

  // helpers/whatsapp (local project import — captures sendMessage + downloadMedia)
  if (specifier.includes('helpers/whatsapp')) {
    return { url: whatsappMock, shortCircuit: true, format: undefined }
  }

  // firebase-admin and firebase-admin/* (npm package)
  if (specifier === 'firebase-admin' || specifier.startsWith('firebase-admin/')) {
    return { url: firebaseMock, shortCircuit: true, format: undefined }
  }

  // @sentry/node
  if (specifier === '@sentry/node') {
    return { url: sentryMock, shortCircuit: true, format: undefined }
  }

  return nextResolve(specifier, context)
}
