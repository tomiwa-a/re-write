export const GET_STARTED_CONTENT = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: null },
        content: [{ type: 'text', text: 'Hi there,' }]
      },
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [
          { type: 'text', text: 'this is a ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'basic' },
          { type: 'text', text: ' example of ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'TipTap' },
          { type: 'text', text: '. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:' }
        ]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', attrs: { textAlign: null }, content: [{ type: 'text', text: 'That’s a bullet list with one …' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', attrs: { textAlign: null }, content: [{ type: 'text', text: '… or two list items.' }] }]
          }
        ]
      },
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [{ type: 'text', text: 'Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:' }]
      },
      {
        type: 'codeBlock',
        // CodeBlock doesn't usually use textAlign, but let's see. 
        // Standard codeBlock has 'language' attr usually.
        attrs: { language: null },
        content: [{ type: 'text', text: 'body {\n  display: none;\n}' }]
      },
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [{ type: 'text', text: 'I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.' }]
      },
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [{ type: 'text', text: 'Wow, that’s amazing. Good work, boy! 👏' }]
      }
    ]
  };
