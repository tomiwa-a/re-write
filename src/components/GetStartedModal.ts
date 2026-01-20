import { Modal } from './Modal';

export class GetStartedModal extends Modal {
  constructor() {
    super({
      showCloseButton: true,
      closeOnBackdrop: true,
      closeOnEscape: true,
      width: '920px',
    });
    this.render();
  }

  private render(): void {
    const content = `
      <div class="get-started-modal">
        <h2 class="get-started-title">Choose Your Project Type</h2>
        <p class="get-started-subtitle">Select the type of project you want to create</p>
        
        <div class="project-options">
          <button class="project-option" data-type="note">
            <div class="project-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            <h3 class="project-option-title">Note</h3>
            <p class="project-option-description">
              Create rich text documents with formatting, lists, and headings. Perfect for writing, journaling, and documentation.
            </p>
            <div class="project-sketch">
              <div class="sketch-note">
                <div class="sketch-line long"></div>
                <div class="sketch-line medium"></div>
                <div class="sketch-line long"></div>
                <div class="sketch-line short"></div>
              </div>
            </div>
          </button>

          <button class="project-option" data-type="canvas">
            <div class="project-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
            <h3 class="project-option-title">Canvas</h3>
            <p class="project-option-description">
              Draw, sketch, and create visual diagrams with a freeform canvas. Ideal for brainstorming and visual thinking.
            </p>
            <div class="project-sketch">
              <div class="sketch-canvas">
                <div class="sketch-shape circle"></div>
                <div class="sketch-shape square"></div>
                <div class="sketch-line-draw"></div>
              </div>
            </div>
          </button>

          <button class="project-option" data-type="erd">
            <div class="project-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <path d="M10 6.5h4"></path>
                <path d="M10 17.5h4"></path>
                <path d="M6.5 10v4"></path>
                <path d="M17.5 10v4"></path>
              </svg>
            </div>
            <h3 class="project-option-title">ERD Diagram</h3>
            <p class="project-option-description">
              Design entity-relationship diagrams for database modeling. Create tables, relationships, and schema visualizations.
            </p>
            <div class="project-sketch">
              <div class="sketch-erd">
                <div class="sketch-table">
                  <div class="sketch-table-header"></div>
                  <div class="sketch-table-row"></div>
                  <div class="sketch-table-row"></div>
                </div>
                <div class="sketch-connector"></div>
                <div class="sketch-table small">
                  <div class="sketch-table-header"></div>
                  <div class="sketch-table-row"></div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    `;

    this.setContent(content);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const body = this.getBody();
    const options = body.querySelectorAll('.project-option');
    options.forEach((option: Element) => {
      option.addEventListener('click', () => {
        const type = option.getAttribute('data-type');
        this.handleProjectSelection(type as string);
      });
    });
  }

  private handleProjectSelection(type: string): void {
    // Dispatch custom event with project type
    const event = new CustomEvent('projectTypeSelected', {
      detail: { type },
    });
    window.dispatchEvent(event);
    this.close();
  }
}
