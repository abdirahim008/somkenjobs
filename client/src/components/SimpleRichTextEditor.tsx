import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Table, Minus, Grid, Settings } from 'lucide-react';
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

      // Make any new tables interactive
      editorRef.current.querySelectorAll('table').forEach(table => {
        if (!table.dataset.interactive) {
          table.dataset.interactive = 'true';
          makeTableInteractive(table as HTMLTableElement);
        }
      });
    }
  };

  const insertTable = () => {
    const tableId = `table_${Date.now()}`;
    const tableHTML = `
      <table id="${tableId}" style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 2px solid #ccc;">
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
    
    // Make table interactive after insertion
    setTimeout(() => {
      const table = document.getElementById(tableId);
      if (table) {
        makeTableInteractive(table as HTMLTableElement);
      }
    }, 100);
  };

  const makeTableInteractive = (table: HTMLTableElement) => {
    let isSelected = false;

    // Create table controls
    const createTableControls = () => {
      const container = table.parentElement;
      if (!container) return;

      // Remove existing controls
      container.querySelectorAll('.table-controls').forEach(control => control.remove());

      // Create control panel
      const controlPanel = document.createElement('div');
      controlPanel.className = 'table-controls';
      controlPanel.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px;
        display: ${isSelected ? 'flex' : 'none'};
        gap: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
      `;

      // Border controls
      const borderControls = [
        { label: 'All Borders', action: 'all' },
        { label: 'Outer Border', action: 'outer' },
        { label: 'Inner Borders', action: 'inner' },
        { label: 'No Borders', action: 'none' }
      ];

      borderControls.forEach(control => {
        const btn = document.createElement('button');
        btn.textContent = control.label;
        btn.style.cssText = `
          padding: 4px 8px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-size: 12px;
          border-radius: 2px;
        `;
        
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          applyTableBorders(table, control.action);
        });
        
        controlPanel.appendChild(btn);
      });

      // Add row/column controls
      const addRowBtn = document.createElement('button');
      addRowBtn.textContent = '+ Row';
      addRowBtn.style.cssText = `
        padding: 4px 8px;
        border: 1px solid #ddd;
        background: #f0f9ff;
        cursor: pointer;
        font-size: 12px;
        border-radius: 2px;
      `;
      addRowBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addTableRow(table);
      });

      const addColBtn = document.createElement('button');
      addColBtn.textContent = '+ Col';
      addColBtn.style.cssText = `
        padding: 4px 8px;
        border: 1px solid #ddd;
        background: #f0f9ff;
        cursor: pointer;
        font-size: 12px;
        border-radius: 2px;
      `;
      addColBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addTableColumn(table);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.style.cssText = `
        padding: 4px 8px;
        border: 1px solid #dc2626;
        background: #fee;
        color: #dc2626;
        cursor: pointer;
        font-size: 12px;
        border-radius: 2px;
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this table?')) {
          table.remove();
        }
      });

      controlPanel.appendChild(addRowBtn);
      controlPanel.appendChild(addColBtn);
      controlPanel.appendChild(deleteBtn);

      // Position container relatively
      if (container.style.position !== 'relative') {
        container.style.position = 'relative';
      }
      container.appendChild(controlPanel);
    };

    // Table selection
    table.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Clear other table selections
      editorRef.current?.querySelectorAll('table').forEach(otherTable => {
        if (otherTable !== table) {
          otherTable.style.outline = 'none';
          const otherContainer = otherTable.parentElement;
          if (otherContainer) {
            otherContainer.querySelectorAll('.table-controls').forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        }
      });
      
      isSelected = !isSelected;
      table.style.outline = isSelected ? '2px solid #0077B5' : 'none';
      
      if (isSelected) {
        createTableControls();
      } else {
        const container = table.parentElement;
        if (container) {
          container.querySelectorAll('.table-controls').forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      }
    });

    // Initial setup
    createTableControls();
  };

  const applyTableBorders = (table: HTMLTableElement, borderType: string) => {
    const cells = table.querySelectorAll('td, th');
    
    switch (borderType) {
      case 'all':
        table.style.border = '2px solid #333';
        cells.forEach(cell => {
          (cell as HTMLElement).style.border = '1px solid #ccc';
        });
        break;
      case 'outer':
        table.style.border = '2px solid #333';
        cells.forEach(cell => {
          (cell as HTMLElement).style.border = 'none';
        });
        break;
      case 'inner':
        table.style.border = 'none';
        cells.forEach(cell => {
          (cell as HTMLElement).style.border = '1px solid #ccc';
        });
        break;
      case 'none':
        table.style.border = 'none';
        cells.forEach(cell => {
          (cell as HTMLElement).style.border = 'none';
        });
        break;
    }
  };

  const addTableRow = (table: HTMLTableElement) => {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return;
    
    const newRow = document.createElement('tr');
    const cellCount = firstRow.children.length;
    
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('td');
      cell.style.cssText = 'border: 1px solid #ccc; padding: 8px;';
      cell.textContent = `Cell ${table.rows.length + 1}-${i + 1}`;
      newRow.appendChild(cell);
    }
    
    table.appendChild(newRow);
  };

  const addTableColumn = (table: HTMLTableElement) => {
    const rows = table.querySelectorAll('tr');
    rows.forEach((row, rowIndex) => {
      const cell = document.createElement('td');
      cell.style.cssText = 'border: 1px solid #ccc; padding: 8px;';
      cell.textContent = rowIndex === 0 ? `Header ${row.children.length + 1}` : `Cell ${rowIndex + 1}-${row.children.length + 1}`;
      if (rowIndex === 0) {
        cell.style.backgroundColor = '#f5f5f5';
        cell.style.fontWeight = 'bold';
      }
      row.appendChild(cell);
    });
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
          // Handle pasted content (images and tables)
          setTimeout(() => {
            if (editorRef.current) {
              // Make pasted images interactive
              editorRef.current.querySelectorAll('img').forEach(img => {
                if (!img.dataset.interactive) {
                  img.dataset.interactive = 'true';
                  makeImageInteractive(img as HTMLImageElement);
                }
              });

              // Make pasted tables interactive and apply default formatting
              editorRef.current.querySelectorAll('table').forEach(table => {
                if (!table.dataset.interactive) {
                  table.dataset.interactive = 'true';
                  
                  // Apply default table styling for pasted tables
                  const tableEl = table as HTMLTableElement;
                  tableEl.style.borderCollapse = 'collapse';
                  tableEl.style.width = '100%';
                  tableEl.style.margin = '10px 0';
                  tableEl.style.border = '2px solid #ccc';
                  
                  // Style all cells
                  const cells = tableEl.querySelectorAll('td, th');
                  cells.forEach(cell => {
                    const cellEl = cell as HTMLElement;
                    cellEl.style.border = '1px solid #ccc';
                    cellEl.style.padding = '8px';
                    
                    // Style header cells
                    if (cell.tagName === 'TH' || (cellEl.parentElement?.firstElementChild === cell && tableEl.rows[0] === cellEl.parentElement)) {
                      cellEl.style.backgroundColor = '#f5f5f5';
                      cellEl.style.fontWeight = 'bold';
                    }
                  });
                  
                  makeTableInteractive(tableEl);
                }
              });
            }
          }, 100);
        }}
        onClick={(e) => {
          // Clear selections when clicking in editor
          if (e.target === editorRef.current) {
            // Clear image selections
            editorRef.current?.querySelectorAll('img').forEach(img => {
              img.style.border = '2px solid transparent';
              const container = img.parentElement;
              if (container) {
                container.querySelectorAll('.resize-handle, .image-delete-btn').forEach(el => {
                  (el as HTMLElement).style.display = 'none';
                });
              }
            });
            
            // Clear table selections
            editorRef.current?.querySelectorAll('table').forEach(table => {
              table.style.outline = 'none';
              const container = table.parentElement;
              if (container) {
                container.querySelectorAll('.table-controls').forEach(el => {
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