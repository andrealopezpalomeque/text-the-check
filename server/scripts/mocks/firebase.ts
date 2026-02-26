/**
 * Mock Firebase Admin SDK + Firestore for tests.
 *
 * Provides chainable Firestore API backed by globalThis.__testFirestoreData.
 * Tests pre-populate collections before running handler calls.
 */

declare global {
  var __testFirestoreData: Map<string, Map<string, Record<string, any>>>
}
globalThis.__testFirestoreData ??= new Map()

function getData() { return globalThis.__testFirestoreData }

// ─── Snapshot helpers ─────────────────────────────────────────
function makeDocSnapshot(id: string, data: Record<string, any> | undefined) {
  const exists = data !== undefined
  return {
    id,
    exists,
    data: () => (exists ? { ...data } : undefined),
    ref: { id },
  }
}

function makeQuerySnapshot(docs: Array<{ id: string; data: Record<string, any> }>) {
  const snapshotDocs = docs.map(d => makeDocSnapshot(d.id, d.data))
  return {
    empty: snapshotDocs.length === 0,
    docs: snapshotDocs,
    size: snapshotDocs.length,
    forEach(cb: (doc: any) => void) { snapshotDocs.forEach(cb) },
  }
}

// ─── Query builder ────────────────────────────────────────────
type WhereFilter = { field: string; op: string; value: any }

function createQuery(col: string, filters: WhereFilter[] = [], limitN?: number) {
  const self = {
    where(field: string, op: string, value: any) {
      return createQuery(col, [...filters, { field, op, value }], limitN)
    },
    orderBy() { return self },
    limit(n: number) { return createQuery(col, filters, n) },
    async get() {
      const data = getData().get(col) ?? new Map()
      let results: Array<{ id: string; data: Record<string, any> }> = []
      for (const [docId, docData] of data.entries()) {
        let match = true
        for (const f of filters) {
          const val = f.field === '__name__' ? docId : docData[f.field]
          switch (f.op) {
            case '==': match = val === f.value; break
            case '>=': match = val >= f.value; break
            case '<=': match = val <= f.value; break
            case 'in': match = Array.isArray(f.value) && f.value.includes(val); break
            case 'array-contains': match = Array.isArray(val) && val.includes(f.value); break
            default: match = false
          }
          if (!match) break
        }
        if (match) results.push({ id: docId, data: docData })
      }
      if (limitN !== undefined) results = results.slice(0, limitN)
      return makeQuerySnapshot(results)
    },
  }
  return self
}

// ─── Document reference ───────────────────────────────────────
function createDocRef(col: string, docId: string) {
  return {
    id: docId,
    async get() {
      return makeDocSnapshot(docId, getData().get(col)?.get(docId))
    },
    async update(data: Record<string, any>) {
      const map = getData().get(col) ?? new Map()
      map.set(docId, { ...(map.get(docId) ?? {}), ...data })
      getData().set(col, map)
    },
    async set(data: Record<string, any>) {
      const map = getData().get(col) ?? new Map()
      map.set(docId, { ...data })
      getData().set(col, map)
    },
    async delete() { getData().get(col)?.delete(docId) },
  }
}

// ─── Collection reference ─────────────────────────────────────
function createCollectionRef(col: string) {
  return {
    doc(docId: string) { return createDocRef(col, docId) },
    where(field: string, op: string, value: any) { return createQuery(col, [{ field, op, value }]) },
    orderBy() { return createQuery(col) },
    async add(data: Record<string, any>) {
      const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const map = getData().get(col) ?? new Map()
      map.set(id, { ...data })
      getData().set(col, map)
      return { id }
    },
    async get() {
      const map = getData().get(col) ?? new Map()
      return makeQuerySnapshot(Array.from(map.entries()).map(([id, data]) => ({ id, data })))
    },
  }
}

// ─── Exports matching config/firebase.ts ──────────────────────
export const db = { collection(name: string) { return createCollectionRef(name) } }
export const messaging = { send: async () => 'mock', sendMulticast: async () => ({ successCount: 0, failureCount: 0, responses: [] }) }

const admin = {
  apps: [{}],
  initializeApp() {},
  credential: { cert() { return {} } },
  firestore: Object.assign(() => db, {
    FieldValue: {
      serverTimestamp() { return new Date() },
      increment(n: number) { return n },
      arrayUnion(...e: any[]) { return e },
      arrayRemove(...e: any[]) { return e },
      delete() { return undefined },
    },
    Timestamp: {
      now() { return { toDate: () => new Date() } },
      fromDate(d: Date) { return { toDate: () => d } },
    },
  }),
  messaging() { return messaging },
}

export { admin }
export default admin

// Re-export FieldValue as named export (used by `import { FieldValue } from 'firebase-admin/firestore'`)
export const FieldValue = admin.firestore.FieldValue
export const Timestamp = admin.firestore.Timestamp
