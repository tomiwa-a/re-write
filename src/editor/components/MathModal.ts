// Templates
const MATH_TEMPLATES = {
  Basics: [
    { label: 'Fraction', latex: '\\frac{x}{y}' },
    { label: 'Exponent', latex: 'x^2' },
    { label: 'Subscript', latex: 'x_1' },
    { label: 'Sqrt', latex: '\\sqrt{x}' },
  ],
  Calculus: [
    { label: 'Sum', latex: '\\sum_{i=0}^{n}' },
    { label: 'Integral', latex: '\\int_{a}^{b}' },
    { label: 'Limit', latex: '\\lim_{x \\to \\infty}' },
    { label: 'Partial', latex: '\\frac{\\partial}{\\partial x}' },
  ],
  Operators: [
    { label: '×', latex: '\\times' },
    { label: '÷', latex: '\\div' },
    { label: '∞', latex: '\\infty' },
    { label: '±', latex: '\\pm' },
    { label: '≈', latex: '\\approx' },
    { label: '≠', latex: '\\neq' },
  ],
  Matrices: [
    { label: 'Matrix', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
    { label: '( )', latex: '\\left( \\frac{a}{b} \\right)' },
  ],
  Physics: [
    { label: 'Quadratic', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Pythagoras', latex: 'a^2 + b^2 = c^2' },
  ]
};

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

    // Templates Section
    const templatesContainer = document.createElement('div');
    templatesContainer.className = 'math-modal-templates';
    
    Object.entries(MATH_TEMPLATES).forEach(([category, items]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'math-modal-category';
      
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'math-modal-category-title';
      categoryTitle.textContent = category;
      categoryDiv.appendChild(categoryTitle);

      const chipsDiv = document.createElement('div');
      chipsDiv.className = 'math-modal-chips';
      
      items.forEach(item => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'math-modal-chip';
        chip.textContent = item.label;
        chip.title = item.latex;
        chip.addEventListener('click', () => this.insertTemplate(item.latex));
        chipsDiv.appendChild(chip);
      });
      
      categoryDiv.appendChild(chipsDiv);
      templatesContainer.appendChild(categoryDiv);
    });
    
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
    this.container.appendChild(templatesContainer); // Add templates
    this.container.appendChild(btnGroup);
    
    this.backdrop.appendChild(this.container);
    
    // Bind events
    this.bindEvents();
  }

  private insertTemplate(latex: string) {
    // Insert at cursor position or append
    const start = this.input.selectionStart || 0;
    const end = this.input.selectionEnd || 0;
    const value = this.input.value;
    
    this.input.value = value.substring(0, start) + latex + value.substring(end);
    
    // Move cursor after insertion
    const newPos = start + latex.length;
    this.input.focus();
    this.input.setSelectionRange(newPos, newPos);
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
