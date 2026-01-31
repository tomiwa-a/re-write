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

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'image-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      if (node.attrs.uploadStatus) {
        img.setAttribute('data-upload-status', node.attrs.uploadStatus);
      }
      if (node.attrs.tempId) {
        img.setAttribute('data-temp-id', node.attrs.tempId);
      }
      
      Object.entries(node.attrs).forEach(([key, value]) => {
        if (key !== 'src' && key !== 'uploadStatus' && key !== 'tempId' && value) {
          img.setAttribute(key, String(value));
        }
      });

      const placeholder = document.createElement('div');
      placeholder.className = 'offline-placeholder';
      placeholder.textContent = 'Offline, image not visible';
      placeholder.style.display = 'none';

      img.onerror = () => {
        console.log('[OptimisticImage] Image failed to load, showing placeholder');
        img.style.display = 'none';
        placeholder.style.display = 'flex';
        img.setAttribute('data-load-error', 'true');
      };

      img.onload = () => {
        img.style.display = 'block';
        placeholder.style.display = 'none';
        img.removeAttribute('data-load-error');
      };

      const handleOnline = () => {
        if (img.getAttribute('data-load-error') === 'true') {
          console.log('[OptimisticImage] Back online, retrying image load');
          const currentSrc = img.src;
          const url = new URL(currentSrc);
          url.searchParams.set('retry', Date.now().toString());
          img.src = url.toString();
        }
      };

      window.addEventListener('online', handleOnline);

      wrapper.appendChild(img);
      wrapper.appendChild(placeholder);

      return {
        dom: wrapper,
        destroy: () => {
          window.removeEventListener('online', handleOnline);
        },
      };
    };
  },
});
