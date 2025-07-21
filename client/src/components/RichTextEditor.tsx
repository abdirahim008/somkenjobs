import React, { useMemo, useCallback, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  required = false,
  height = "300px",
  minHeight = "200px",
  maxHeight = "600px"
}) => {
  const [currentHeight, setCurrentHeight] = useState(parseInt(height));
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

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
        'table-insert': function(this: any) {
          // Insert a simple 3x3 table
          const quill = this.quill;
          const range = quill.getSelection();
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
            quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
          }
        },
        'table-delete': function(this: any) {
          // Remove selected table or the table containing the cursor
          const quill = this.quill;
          const range = quill.getSelection();
          if (range) {
            const [line] = quill.getLine(range.index);
            if (line && line.domNode) {
              const table = line.domNode.closest('table');
              if (table) {
                table.remove();
              }
            }
          }
        },
        'image': function(this: any) {
          // Create file input for image upload
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = () => {
            const file = input.files?.[0];
            if (file) {
              // Create a file reader to convert to base64
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                const quill = this.quill;
                const range = quill.getSelection();
                if (range) {
                  // Insert image with custom attributes for resizing
                  quill.insertEmbed(range.index, 'image', base64);
                  
                  // Add resize functionality after image is inserted
                  setTimeout(() => {
                    const images = quill.container.querySelectorAll('img');
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
        }
      }
    },
    clipboard: {
      // Allow pasting with formatting and tables
      matchVisual: false,
      // Allow table pasting
      matchers: [
        ['table', function(node: any, delta: any) {
          return delta;
        }]
      ]
    },
  }), []);

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
    // Prevent infinite loops by only calling onChange if content actually changed
    if (content !== value) {
      onChange(content);
    }
  }, [onChange, value]);

  // Function to make images resizable and draggable
  const makeImageResizable = useCallback((img: HTMLImageElement) => {
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
      width: 10px;
      height: 10px;
      background: #0077B5;
      border: 2px solid white;
      border-radius: 50%;
      cursor: nw-resize;
      z-index: 1000;
      display: none;
    `;
    
    // Create wrapper for image and handle
    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      max-width: 100%;
    `;
    
    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(resizeHandle);
    
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
    let isResizing = false;
    let startWidth = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startWidth = img.offsetWidth;
      startX = e.clientX;
      e.stopPropagation();
      e.preventDefault();
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(50, Math.min(800, startWidth + deltaX));
        img.style.width = newWidth + 'px';
        img.style.height = 'auto';
      };
      
      const handleMouseUp = () => {
        isResizing = false;
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
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1001;
        min-width: 120px;
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
        `;
        
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#f5f5f5';
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

  return (
    <div className={`rich-text-editor ${isResizing ? 'resizing' : ''}`} ref={containerRef}>
      <div className="relative">
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ 
            height: `${currentHeight}px`,
            minHeight: minHeight
          }}
        />
        
        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        />
      </div>
    </div>
  );
};