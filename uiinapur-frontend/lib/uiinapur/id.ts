export function localId() { return globalThis.crypto?.randomUUID?.() || Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''); }
