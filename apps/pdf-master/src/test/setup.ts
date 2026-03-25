import '@testing-library/jest-dom/vitest';

if (!File.prototype.arrayBuffer) {
  Object.defineProperty(File.prototype, 'arrayBuffer', {
    value: function arrayBuffer(this: Blob) {
      return new Response(this).arrayBuffer();
    },
  });
}
