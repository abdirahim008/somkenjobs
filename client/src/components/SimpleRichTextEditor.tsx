import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Table, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  defaultHeight?: string;
  height?: string;
  required?: boolean;
}

export const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  className = "",
  minHeight = "200px",
  maxHeight = "700px",
  defaultHeight = "350px",
  height,
  required = false
}) => {
  const initialHeight = height || defaultHeight;
  const [currentHeight, setCurrentHeight] = useState(parseInt(initialHeight));
  const [isResizing, setIsResizing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // Make any new images interactive
      editorRef.current.querySelectorAll('img').forEach(img => {
        if (!img.dataset.interactive) {
          img.dataset.interactive = 'true';
          makeImageInteractive(img as HTMLImageElement);
        }
      });
    }
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px; background-color: #f5f5f5; font-weight: bold;">Header 1</td>
          <td style="border: 1px solid #ccc; padding: 8px; background-color: #f5f5f5; font-weight: bold;">Header 2</td>
          <td style="border: 1px solid #ccc; padding: 8px; background-color: #f5f5f5; font-weight: bold;">Header 3</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 1</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 2</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 3</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 4</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 5</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 6</td>
        </tr>
      </table>
    `;
    execCommand('insertHTML', tableHTML);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const imgId = `img_${Date.now()}`;
        const imgHTML = `
          <div class="image-container" style="position: relative; display: inline-block; margin: 10px 0;">
            <img id="${imgId}" src="${result}" alt="Uploaded image" 
                 style="max-width: 300px; height: auto; border: 2px solid transparent; border-radius: 4px; cursor: move; display: block;" 
                 draggable="true" />
          </div>
        `;
        execCommand('insertHTML', imgHTML);
        
        // Add event listeners after insertion
        setTimeout(() => {
          const img = document.getElementById(imgId);
          if (img) {
            makeImageInteractive(img as HTMLImageElement);
          }
        }, 100);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const makeImageInteractive = (img: HTMLImageElement) => {
    let isResizing = false;
    let isSelected = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let isDragging = false;

    // Create resize handles
    const createResizeHandles = () => {
      const container = img.parentElement;
      if (!container) return;

      // Remove existing handles
      container.querySelectorAll('.resize-handle').forEach(handle => handle.remove());

      // Create corner handles
      const positions = ['nw', 'ne', 'sw', 'se'];
      positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${pos}`;
        handle.style.cssText = `
          position: absolute;
          width: 8px;
          height: 8px;
          background: #0077B5;
          border: 1px solid white;
          border-radius: 50%;
          cursor: ${pos.includes('n') ? (pos.includes('w') ? 'nw' : 'ne') : (pos.includes('w') ? 'sw' : 'se')}-resize;
          z-index: 1000;
          display: ${isSelected ? 'block' : 'none'};
        `;
        
        // Position handles
        if (pos.includes('n')) handle.style.top = '-4px';
        if (pos.includes('s')) handle.style.bottom = '-4px';
        if (pos.includes('w')) handle.style.left = '-4px';
        if (pos.includes('e')) handle.style.right = '-4px';

        container.appendChild(handle);

        // Add resize functionality
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          startX = e.clientX;
          startY = e.clientY;
          startWidth = img.offsetWidth;

          const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            let newWidth = startWidth;
            
            if (pos.includes('e')) newWidth = startWidth + deltaX;
            else if (pos.includes('w')) newWidth = startWidth - deltaX;
            
            newWidth = Math.max(50, Math.min(800, newWidth));
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
      });

      // Create delete button
      const deleteBtn = document.createElement('div');
      deleteBtn.className = 'image-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        display: ${isSelected ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        z-index: 1001;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      `;
      
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this image?')) {
          container.remove();
        }
      });
      
      container.appendChild(deleteBtn);
    };

    // Image selection
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Clear other selections
      editorRef.current?.querySelectorAll('img').forEach(otherImg => {
        if (otherImg !== img) {
          otherImg.style.border = '2px solid transparent';
          const otherContainer = otherImg.parentElement;
          if (otherContainer) {
            otherContainer.querySelectorAll('.resize-handle, .image-delete-btn').forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        }
      });
      
      isSelected = !isSelected;
      img.style.border = isSelected ? '2px solid #0077B5' : '2px solid transparent';
      
      if (isSelected) {
        createResizeHandles();
      } else {
        const container = img.parentElement;
        if (container) {
          container.querySelectorAll('.resize-handle, .image-delete-btn').forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    // Context menu for image sizing
    img.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      const menu = document.createElement('div');
      menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        min-width: 150px;
        overflow: hidden;
      `;

      const options = [
        { label: 'Small (150px)', width: 150 },
        { label: 'Medium (300px)', width: 300 },
        { label: 'Large (500px)', width: 500 },
        { label: 'Original Size', width: null },
        { label: 'Delete Image', action: 'delete' }
      ];

      options.forEach((option, index) => {
        const item = document.createElement('div');
        item.textContent = option.label;
        item.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: ${index < options.length - 1 ? '1px solid #eee' : 'none'};
          background: ${option.action === 'delete' ? '#fee' : 'white'};
          color: ${option.action === 'delete' ? '#dc2626' : 'black'};
        `;
        
        item.addEventListener('mouseenter', () => {
          item.style.background = option.action === 'delete' ? '#fecaca' : '#f5f5f5';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.background = option.action === 'delete' ? '#fee' : 'white';
        });
        
        item.addEventListener('click', () => {
          if (option.action === 'delete') {
            if (confirm('Delete this image?')) {
              img.parentElement?.remove();
            }
          } else if (option.width) {
            img.style.width = option.width + 'px';
            img.style.height = 'auto';
          } else {
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.maxWidth = '100%';
          }
          menu.remove();
        });
        
        menu.appendChild(item);
      });

      document.body.appendChild(menu);

      // Remove menu when clicking elsewhere
      const removeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          menu.remove();
          document.removeEventListener('click', removeMenu);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', removeMenu);
      }, 100);
    });

    // Drag functionality
    img.addEventListener('dragstart', (e) => {
      isDragging = true;
      e.dataTransfer?.setData('text/html', img.outerHTML);
    });

    img.addEventListener('dragend', () => {
      isDragging = false;
    });

    // Initial setup
    createResizeHandles();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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
  };

  return (
    <div className={`simple-rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="toolbar" style={{
        border: '1px solid #e5e7eb',
        borderBottom: 'none',
        borderRadius: '0.375rem 0.375rem 0 0',
        background: '#f9fafb',
        padding: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
      }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }} />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }} />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }} />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
          title="Insert Table"
        >
          <Table className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        style={{
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          borderRadius: '0 0 0.375rem 0.375rem',
          background: 'white',
          padding: '12px',
          minHeight: `${currentHeight}px`,
          maxHeight: maxHeight,
          overflow: 'auto',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'Inter, sans-serif',
          outline: 'none'
        }}
        data-placeholder={placeholder}
        onPaste={(e) => {
          // Handle pasted images
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.querySelectorAll('img').forEach(img => {
                if (!img.dataset.interactive) {
                  img.dataset.interactive = 'true';
                  makeImageInteractive(img as HTMLImageElement);
                }
              });
            }
          }, 100);
        }}
        onClick={(e) => {
          // Clear image selections when clicking in editor
          if (e.target === editorRef.current) {
            editorRef.current?.querySelectorAll('img').forEach(img => {
              img.style.border = '2px solid transparent';
              const container = img.parentElement;
              if (container) {
                container.querySelectorAll('.resize-handle, .image-delete-btn').forEach(el => {
                  (el as HTMLElement).style.display = 'none';
                });
              }
            });
          }
        }}
      />

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag to resize"
        style={{
          position: 'relative',
          height: '10px',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{
          width: '40px',
          height: '4px',
          background: '#ddd',
          borderRadius: '2px'
        }} />
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;