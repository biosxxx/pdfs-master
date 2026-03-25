export function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

export function cloneArrayBuffer(data: ArrayBuffer): ArrayBuffer {
  return data.slice(0);
}
