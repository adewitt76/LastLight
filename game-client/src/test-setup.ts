// Mock custom elements if needed
if (typeof customElements === 'undefined') {
  (global as any).customElements = {
    define: jest.fn(),
    get: jest.fn(),
    upgrade: jest.fn(),
    whenDefined: jest.fn().mockResolvedValue(undefined)
  };
}