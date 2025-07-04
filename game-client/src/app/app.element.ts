import './app.element.css';

export class AppElement extends HTMLElement {
  public static observedAttributes: string[] = [];

  connectedCallback(): void {
    // Clear any default content - this element is just for compatibility
    // The actual game runs in the #app div from main.ts
    this.innerHTML = '';
    
    // Hide this element to prevent any layout issues
    this.style.display = 'none';
  }
}

customElements.define('app-root', AppElement);
