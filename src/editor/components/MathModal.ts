export class MathModal {
  private container: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private input: HTMLInputElement;
  private saveBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private onSubmit: (latex: string) => void;
  private onCancel: () => void;

  constructor(onSubmit: (latex: string) => void, onCancel: () => void = () => {}) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    
    // Create elements
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'math-modal-backdrop';
    
    this.container = document.createElement('div');
    this.container.className = 'math-modal-container';
    
    const title = document.createElement('h3');
    title.textContent = 'Edit Equation';
    
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'E = mc^2';
    this.input.className = 'math-modal-input';
    
    const btnGroup = document.createElement('div');
    btnGroup.className = 'math-modal-actions';
    
    this.cancelBtn = document.createElement('button');
    this.cancelBtn.textContent = 'Cancel';
    this.cancelBtn.className = 'math-modal-cancel';
    
    this.saveBtn = document.createElement('button');
    this.saveBtn.textContent = 'Save';
    this.saveBtn.className = 'math-modal-save';
    
    // Assemble
    btnGroup.appendChild(this.cancelBtn);
    btnGroup.appendChild(this.saveBtn);
    
    this.container.appendChild(title);
    this.container.appendChild(this.input);
    this.container.appendChild(btnGroup);
    
    this.backdrop.appendChild(this.container);
    
    // Bind events
    this.bindEvents();
  }

  private bindEvents() {
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });
    
    this.cancelBtn.addEventListener('click', () => this.close());
    
    this.saveBtn.addEventListener('click', () => this.submit());
    
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
      if (e.key === 'Escape') this.close();
    });
  }

  public open(initialValue: string = '') {
    this.input.value = initialValue;
    document.body.appendChild(this.backdrop);
    // Focus input after a small delay to ensure DOM is ready
    setTimeout(() => this.input.focus(), 50);
  }

  public close() {
    this.backdrop.remove();
    this.onCancel();
  }

  private submit() {
    const value = this.input.value.trim();
    if (value) {
      this.onSubmit(value);
      this.backdrop.remove();
    } else {
      this.close();
    }
  }
}

// Singleton helper
let currentModal: MathModal | null = null;

export function openMathModal(
  initialValue: string, 
  onSubmit: (latex: string) => void
) {
  if (currentModal) {
    currentModal.close();
  }
  
  currentModal = new MathModal(onSubmit, () => {
    currentModal = null;
  });
  
  currentModal.open(initialValue);
}
