/**
 * No-op Sentry mock.
 */
export function captureException(_err: unknown) {}
export function captureMessage(_msg: string, _opts?: any) {}
export function init(_opts: unknown) {}
export function setTag(_key: string, _value: string) {}
export function setUser(_user: unknown) {}
export function addBreadcrumb(_crumb: unknown) {}
export function startTransaction(_ctx: unknown) { return { finish() {} } }
export default { captureException, captureMessage, init, setTag, setUser, addBreadcrumb, startTransaction }
