import { AppElement } from './app.element';

describe('AppElement', () => {
  let app: AppElement;

  beforeEach(() => {
    app = new AppElement();
    // Ensure the element is properly connected to DOM for testing
    document.body.appendChild(app);
  });

  afterEach(() => {
    // Clean up after each test
    if (app?.parentNode) {
      app.parentNode.removeChild(app);
    }
  });

  it('should create successfully', () => {
    expect(app).toBeTruthy();
  });

  it('should be hidden when connected', () => {
    app.connectedCallback();

    expect(app.innerHTML).toBe('');
    expect(app.style.display).toBe('none');
  });
});
