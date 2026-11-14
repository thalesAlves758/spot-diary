// App information for the UI. The version comes from js/version.js, a classic script loaded before the modules.

/** App version (RN19), or 'dev' when js/version.js wasn't loaded (e.g. in Node tests). */
export function getAppVersion() {
  return globalThis.APP_VERSION ?? 'dev';
}
