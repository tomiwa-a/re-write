export const GET_STARTED_CONTENT = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: null },
        content: [{ type: 'text', text: 'Welcome to your new Workspace 🚀' }]
      },
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [
          { type: 'text', text: 'This is ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'Re:Write' },
          { type: 'text', text: ', a modern platform designed for ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'clarity' },
          { type: 'text', text: ' and ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'creativity' },
          { type: 'text', text: '. Whether you are writing documentation, brainstorming ideas, or planning databases, we have you covered.' }
        ]
      },
      {
        type: 'blockquote',
        content: [
            {
                type: 'paragraph',
                content: [{ type: 'text', text: '“Simplicity is the ultimate sophistication.” — Leonardo da Vinci' }]
            }
        ]
      },
      {
        type: 'horizontalRule'
      },
      {
        type: 'heading',
        attrs: { level: 2, textAlign: null },
        content: [{ type: 'text', text: '📚 Stay Organized' }]
      },
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [{ type: 'text', text: 'Keep your projects structured with our versatile file types:' }]
      },
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                attrs: { textAlign: null },
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Notes' },
                    { type: 'text', text: ': Rich text documents with markdown support, perfect for specs and journals.' }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                attrs: { textAlign: null },
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Canvas' },
                    { type: 'text', text: ': An infinite whiteboard for sketching, diagramming, and free-form thinking.' }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                attrs: { textAlign: null },
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'ERD' },
                    { type: 'text', text: ': specialized diagrams for mapping out your database relationships.' }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2, textAlign: null },
        content: [{ type: 'text', text: '⚡️ Power Features' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
                {
                    type: 'paragraph',
                    content: [
                         { type: 'text', marks: [{ type: 'bold' }], text: 'Code Blocks' },
                         { type: 'text', text: ': Syntax highlighting for over 100 languages.' }
                    ]
                },
                {
                    type: 'codeBlock',
                    attrs: { language: 'javascript' },
                    content: [{ type: 'text', text: 'function hello(name) {\n  console.log(`Hello, ${name}!`);\n}' }]
                }
            ]
          },
          {
             type: 'listItem',
             content: [
                 {
                     type: 'paragraph',
                     content: [
                          { type: 'text', marks: [{ type: 'bold' }], text: 'Offline Support' },
                          { type: 'text', text: ': Work anywhere. Changes sync automatically when you reconnect.' }
                     ]
                 }
             ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2, textAlign: null },
        content: [{ type: 'text', text: '⌨️ Shortcuts' }]
      },
      {
          type: 'paragraph',
          content: [
              { type: 'text', text: 'Speed up your workflow:' },
              { type: 'text', marks: [{ type: 'code' }], text: ' Cmd+B ' },
              { type: 'text', text: ' for bold, ' },
              { type: 'text', marks: [{ type: 'code' }], text: ' Cmd+I ' },
              { type: 'text', text: ' for italic, and ' },
              { type: 'text', marks: [{ type: 'code' }], text: ' Cmd+E ' },
              { type: 'text', text: ' for inline code.' }
          ]
      },
       {
        type: 'horizontalRule'
      },
      {
        type: 'paragraph',
        attrs: { textAlign: 'center' },
        content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'Ready to build something amazing? Click "New File" to start.' }]
      }
    ]
  };
