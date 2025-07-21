import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';

// Dynamic import of ReactQuill to fix SSR/import issues
let ReactQuill: any = null;

const loadReactQuill = async () => {
  if (typeof window !== 'undefined') {
    const { default: RQ } = await import('react-quill');
    ReactQuill = RQ;
    return RQ;
  }
  return null;
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  defaultHeight?: string;
  height?: string; // Add height prop for backwards compatibility
  required?: boolean; // Add required prop
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
  minHeight = "200px",
  maxHeight = "700px",
  defaultHeight = "350px",
  height, // Accept height prop
  required = false
}) => {
  // Use height prop if provided, otherwise use defaultHeight
  const initialHeight = height || defaultHeight;
  const [currentHeight, setCurrentHeight] = useState(parseInt(initialHeight));
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const [quillRef, setQuillRef] = useState<any>(null);
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);

  // Load ReactQuill dynamically
  useEffect(() => {
    loadReactQuill().then((quill) => {
      if (quill) {
        ReactQuill = quill;
        setIsQuillLoaded(true);
      }
    });
  }, []);

  // Function to make images resizable and draggable
  const makeImageResizable = useCallback((img: HTMLImageElement) => {
    // Skip if already has wrapper
    if (img.parentElement?.classList.contains('image-wrapper')) {
      return;
    }

    img.style.cursor = 'move';
    img.style.position = 'relative';
    img.style.display = 'inline-block';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    
    // Add resize handles
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'image-resize-handle';
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: -5px;
      right: -5px;
      width: 12px;
      height: 12px;
      background: #0077B5;
      border: 2px solid white;
      border-radius: 50%;
      cursor: nw-resize;
      z-index: 1000;
      display: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    `;
    
    // Create wrapper for image and handle
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      max-width: 100%;
    `;
    
    // Insert wrapper before image and move image into wrapper
    if (img.parentNode) {
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
      wrapper.appendChild(resizeHandle);
    }
    
    // Show/hide resize handle on hover
    wrapper.addEventListener('mouseenter', () => {
      resizeHandle.style.display = 'block';
    });
    
    wrapper.addEventListener('mouseleave', () => {
      resizeHandle.style.display = 'none';
    });
    
    // Image dragging functionality
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    img.addEventListener('mousedown', (e) => {
      if (e.target === resizeHandle) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
      
      // Add visual feedback for dragging
      img.classList.add('dragging');
      wrapper.classList.add('selected');
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Move image with visual feedback
        wrapper.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        wrapper.style.zIndex = '1000';
      };
      
      const handleMouseUp = () => {
        isDragging = false;
        img.classList.remove('dragging');
        wrapper.classList.remove('selected');
        wrapper.style.zIndex = 'auto';
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Image resizing functionality
    let isResizingImage = false;
    let startWidth = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizingImage = true;
      startWidth = img.offsetWidth;
      startX = e.clientX;
      e.stopPropagation();
      e.preventDefault();
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingImage) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(50, Math.min(800, startWidth + deltaX));
        img.style.width = newWidth + 'px';
        img.style.height = 'auto';
      };
      
      const handleMouseUp = () => {
        isResizingImage = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Add context menu for image options
    img.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      const menu = document.createElement('div');
      menu.className = 'image-context-menu';
      menu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: white;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        padding: 4px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        min-width: 140px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      
      const options = [
        { text: 'Small (200px)', width: 200 },
        { text: 'Medium (400px)', width: 400 },
        { text: 'Large (600px)', width: 600 },
        { text: 'Original Size', width: null },
        { text: 'Remove Image', width: 'remove' }
      ];
      
      options.forEach(option => {
        const item = document.createElement('div');
        item.textContent = option.text;
        item.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #333;
          transition: background-color 0.1s ease;
        `;
        
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#f8f9fa';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'transparent';
        });
        
        item.addEventListener('click', () => {
          if (option.width === 'remove') {
            wrapper.remove();
          } else if (option.width === null) {
            img.style.width = 'auto';
            img.style.height = 'auto';
          } else {
            img.style.width = option.width + 'px';
            img.style.height = 'auto';
          }
          menu.remove();
        });
        
        menu.appendChild(item);
      });
      
      document.body.appendChild(menu);
      
      // Remove menu when clicking outside
      setTimeout(() => {
        const removeMenu = (e: MouseEvent) => {
          if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener('click', removeMenu);
          }
        };
        document.addEventListener('click', removeMenu);
      }, 100);
    });
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['table-insert', 'table-delete'],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ],
      handlers: {
        'table-insert': () => {
          if (!quillRef) return;
          
          try {
            const range = quillRef.getSelection();
            if (range) {
              const tableHtml = `
                <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">Header 1</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">Header 2</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">Header 3</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">Row 1, Col 1</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">Row 1, Col 2</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">Row 1, Col 3</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">Row 2, Col 1</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">Row 2, Col 2</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">Row 2, Col 3</td>
                  </tr>
                </table>
              `;
              quillRef.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
            }
          } catch (error) {
            console.error('Error inserting table:', error);
          }
        },
        'table-delete': () => {
          if (!quillRef) return;
          
          try {
            const range = quillRef.getSelection();
            if (range) {
              const [line] = quillRef.getLine(range.index);
              if (line && line.domNode) {
                const table = line.domNode.closest('table');
                if (table) {
                  table.remove();
                }
              }
            }
          } catch (error) {
            console.error('Error deleting table:', error);
          }
        },
        'image': () => {
          if (!quillRef) return;
          
          try {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = () => {
              const file = input.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64 = e.target?.result as string;
                  const range = quillRef.getSelection();
                  if (range) {
                    quillRef.insertEmbed(range.index, 'image', base64);
                    
                    setTimeout(() => {
                      const images = quillRef.container.querySelectorAll('img');
                      const lastImage = images[images.length - 1];
                      if (lastImage) {
                        makeImageResizable(lastImage);
                      }
                    }, 100);
                  }
                };
                reader.readAsDataURL(file);
              }
            };
          } catch (error) {
            console.error('Error handling image upload:', error);
          }
        }
      }
    },
    clipboard: {
      matchVisual: false,
    },
  }), [quillRef, makeImageResizable]);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image',
    'color', 'background',
    'table', 'table-cell-line', 'table-cell', 'table-col', 'table-row',
    'clean'
  ], []);

  const handleChange = useCallback((content: string) => {
    if (content !== value) {
      onChange(content);
    }
  }, [onChange, value]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = currentHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(
        parseInt(minHeight), 
        Math.min(parseInt(maxHeight), startHeight + deltaY)
      );
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentHeight, minHeight, maxHeight]);

  // Effect to make existing images resizable when component mounts or value changes
  React.useEffect(() => {
    if (containerRef.current) {
      const images = containerRef.current.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.parentElement?.classList.contains('image-wrapper')) {
          makeImageResizable(img as HTMLImageElement);
        }
      });
    }
  }, [value, makeImageResizable]);

  // Show loading state while Quill is loading
  if (!isQuillLoaded || !ReactQuill) {
    return (
      <div style={{ padding: '10px', border: '1px solid #ddd', background: '#f9f9f9', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 10px 0', color: '#666' }}>Loading rich text editor...</p>
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: `${currentHeight}px`,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${isResizing ? 'resizing' : ''}`} ref={containerRef}>
      <div className="relative">
        <ReactQuill
          ref={(el) => {
            console.log('ReactQuill ref callback:', el);
            if (el && el.getEditor() !== quillRef) {
              setQuillRef(el.getEditor());
            }
          }}
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ 
            height: `${currentHeight}px`,
            minHeight: minHeight,
            width: '100%',
            display: 'block'
          }}
        />
        
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40px',
            height: '10px',
            background: '#ddd',
            borderRadius: '4px',
            cursor: 'ns-resize',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;