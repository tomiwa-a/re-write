import Image from '@tiptap/extension-image';

export const OptimisticImage = Image.extend({
  name: 'image',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      uploadStatus: {
        default: null,
        parseHTML: element => element.getAttribute('data-upload-status'),
        renderHTML: attributes => {
          if (!attributes.uploadStatus) return {};
          return { 'data-upload-status': attributes.uploadStatus };
        },
      },
      tempId: {
        default: null,
        parseHTML: element => element.getAttribute('data-temp-id'),
        renderHTML: attributes => {
          if (!attributes.tempId) return {};
          return { 'data-temp-id': attributes.tempId };
        },
      },
    };
  },
});
