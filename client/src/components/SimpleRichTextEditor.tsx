import React, { useState, useRef, useEffect } from 'react';
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
  const isUpdatingRef = useRef(false);
  const lastContentRef = useRef<string>(value || '');

  // Get cursor position as offset from start of text content
  const getCursorOffset = (): number => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current) return 0;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  };

  // Set cursor position by offset from start of text content
  const setCursorOffset = (offset: number) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection) return;

    let currentOffset = 0;
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      const textLength = node.textContent?.length || 0;
      if (currentOffset + textLength >= offset) {
        const range = document.createRange();
        range.setStart(node, Math.max(0, offset - currentOffset));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      currentOffset += textLength;
    }

    // If offset is beyond content, place at end
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const execCommand = (command: string, value?: string) => {
    const cursorOffset = getCursorOffset();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Small delay to ensure DOM is updated before restoring position
    setTimeout(() => setCursorOffset(cursorOffset), 0);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current && !isUpdatingRef.current) {
      const content = editorRef.current.innerHTML;
      lastContentRef.current = content;
      
      // Only call onChange if content actually changed
      if (content !== value) {
        onChange(content);
        
        // Make any new images/tables interactive without affecting cursor
        requestAnimationFrame(() => {
          if (editorRef.current) {
            // Style pasted tables with borders
            editorRef.current.querySelectorAll('table:not([data-styled])').forEach(table => {
              styleTable(table as HTMLTableElement);
              (table as HTMLTableElement).dataset.styled = 'true';
            });

            editorRef.current.querySelectorAll('img').forEach(img => {
              if (!img.dataset.interactive) {
                console.log('Making image interactive:', img);
                img.dataset.interactive = 'true';
                makeImageInteractive(img as HTMLImageElement);
              }
            });

            editorRef.current.querySelectorAll('table').forEach(table => {
              if (!table.dataset.interactive) {
                table.dataset.interactive = 'true';
                makeTableInteractive(table as HTMLTableElement);
              }
            });
          }
        });
      }
    }
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
      lastContentRef.current = value || '';
    }
  }, []);

  // Update editor content when value prop changes but preserve cursor
  useEffect(() => {
    if (editorRef.current && value !== undefined && !isUpdatingRef.current) {
      const currentContent = editorRef.current.innerHTML;
      // Only update if there's a significant difference
      if (currentContent !== value && lastContentRef.current !== value) {
        const wasFocused = document.activeElement === editorRef.current;
        const cursorOffset = wasFocused ? getCursorOffset() : 0;
        
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = value || '';
        lastContentRef.current = value || '';
        
        if (wasFocused) {
          setTimeout(() => {
            setCursorOffset(cursorOffset);
            isUpdatingRef.current = false;
          }, 0);
        } else {
          isUpdatingRef.current = false;
        }
      }
    }
  }, [value]);

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

    // Apply advanced styling to existing table
    if (!table.dataset.styled) {
      styleTable(table);
      table.dataset.styled = 'true';
    }

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
      if (container && container.style.position !== 'relative') {
        container.style.position = 'relative';
      }
      if (container) {
        container.appendChild(controlPanel);
      }
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

  const styleTable = (table: HTMLTableElement) => {
    // Apply basic table styling for pasted tables
    table.style.cssText = `
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
      border: 1px solid #ccc;
      resize: both;
      overflow: auto;
      min-width: 200px;
      min-height: 100px;
      table-layout: fixed;
      border-spacing: 0;
    `;
    
    // Style all cells and make them resizable
    const cells = table.querySelectorAll('td, th');
    cells.forEach((cell, index) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.cssText = `
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
        vertical-align: top;
        position: relative;
        overflow: hidden;
        resize: horizontal;
        min-width: 50px;
      `;
      
      // Style header row differently
      const row = cell.parentElement as HTMLTableRowElement;
      if (cell.tagName === 'TH' || (row && row.rowIndex === 0)) {
        htmlCell.style.backgroundColor = '#f5f5f5';
        htmlCell.style.fontWeight = 'bold';
      }
      
      // Add resize handle to each cell
      addCellResizeHandle(htmlCell);
    });
    
    // Make table resizable
    table.style.resize = 'both';
    table.style.overflow = 'auto';
  };

  const addCellResizeHandle = (cell: HTMLElement) => {
    // Remove existing handles
    cell.querySelectorAll('.cell-resize-handle').forEach(handle => handle.remove());
    
    // Create column resize handle (right border)
    const columnHandle = document.createElement('div');
    columnHandle.className = 'cell-resize-handle column-resize';
    columnHandle.style.cssText = `
      position: absolute;
      top: 0;
      right: -2px;
      width: 4px;
      height: 100%;
      background: transparent;
      cursor: col-resize;
      z-index: 10;
    `;
    
    // Create row resize handle (bottom border)
    const rowHandle = document.createElement('div');
    rowHandle.className = 'cell-resize-handle row-resize';
    rowHandle.style.cssText = `
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 4px;
      background: transparent;
      cursor: row-resize;
      z-index: 10;
    `;
    
    // Hover effects for column handle
    columnHandle.addEventListener('mouseenter', () => {
      columnHandle.style.background = 'rgba(0, 119, 181, 0.3)';
    });
    
    columnHandle.addEventListener('mouseleave', () => {
      columnHandle.style.background = 'transparent';
    });
    
    // Hover effects for row handle
    rowHandle.addEventListener('mouseenter', () => {
      rowHandle.style.background = 'rgba(0, 119, 181, 0.3)';
    });
    
    rowHandle.addEventListener('mouseleave', () => {
      rowHandle.style.background = 'transparent';
    });
    
    // Column resizing functionality
    let isResizingColumn = false;
    let startX = 0;
    let startWidth = 0;
    
    columnHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingColumn = true;
      startX = e.clientX;
      startWidth = cell.offsetWidth;
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingColumn) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + deltaX);
        
        // Update all cells in the same column
        const table = cell.closest('table');
        if (table) {
          const cellIndex = Array.from(cell.parentElement!.children).indexOf(cell);
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const targetCell = row.children[cellIndex] as HTMLElement;
            if (targetCell) {
              targetCell.style.width = newWidth + 'px';
              targetCell.style.minWidth = newWidth + 'px';
            }
          });
        }
      };
      
      const handleMouseUp = () => {
        isResizingColumn = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    // Row resizing functionality
    let isResizingRow = false;
    let startY = 0;
    let startHeight = 0;
    
    rowHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRow = true;
      startY = e.clientY;
      startHeight = cell.offsetHeight;
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingRow) return;
        
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(30, startHeight + deltaY);
        
        // Update all cells in the same row
        const row = cell.parentElement;
        if (row) {
          Array.from(row.children).forEach(rowCell => {
            const htmlCell = rowCell as HTMLElement;
            htmlCell.style.height = newHeight + 'px';
            htmlCell.style.minHeight = newHeight + 'px';
          });
        }
      };
      
      const handleMouseUp = () => {
        isResizingRow = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    cell.appendChild(columnHandle);
    cell.appendChild(rowHandle);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const imgId = `img_${Date.now()}`;
        const imgHTML = `
          <div class="image-container" style="position: relative; display: inline-block; margin: 10px 0; min-height: 50px;">
            <img id="${imgId}" src="${result}" alt="Uploaded image" 
                 style="max-width: 300px; width: 300px; height: auto; border: 2px solid transparent; border-radius: 4px; cursor: pointer; display: block; user-select: none;" 
                 draggable="false" />
          </div>
        `;
        execCommand('insertHTML', imgHTML);
        
        // Add event listeners after insertion with delay to ensure DOM is updated
        setTimeout(() => {
          const img = document.getElementById(imgId);
          if (img) {
            console.log('Making uploaded image interactive:', img);
            img.dataset.interactive = 'true';
            makeImageInteractive(img as HTMLImageElement);
          }
        }, 200);
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
    
    // Ensure the container has proper positioning
    const container = img.parentElement;
    if (container && container.style.position !== 'relative') {
      container.style.position = 'relative';
    }

    // Create resize handles
    const createResizeHandles = () => {
      const container = img.parentElement;
      if (!container) {
        console.log('No container found for image');
        return;
      }

      console.log('Creating resize handles for image in container:', container);

      // Remove existing handles
      container.querySelectorAll('.resize-handle, .image-delete-btn').forEach(handle => handle.remove());

      // Ensure container positioning
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      
      // Create corner handles
      const positions = ['nw', 'ne', 'sw', 'se'];
      positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${pos}`;
        handle.style.cssText = `
          position: absolute;
          width: 12px;
          height: 12px;
          background: #0077B5;
          border: 2px solid white;
          border-radius: 50%;
          cursor: ${pos.includes('n') ? (pos.includes('w') ? 'nw' : 'ne') : (pos.includes('w') ? 'sw' : 'se')}-resize;
          z-index: 1000;
          display: block !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          visibility: visible;
          opacity: 1;
        `;
        
        // Position handles at corners
        if (pos.includes('n')) handle.style.top = '-6px';
        if (pos.includes('s')) handle.style.bottom = '-6px';
        if (pos.includes('w')) handle.style.left = '-6px';
        if (pos.includes('e')) handle.style.right = '-6px';

        console.log(`Adding ${pos} handle to container`);
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
        top: -11px;
        right: -11px;
        width: 24px;
        height: 24px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        display: flex !important;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        z-index: 1001;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        border: 2px solid white;
        visibility: visible;
        opacity: 1;
      `;
      
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this image?')) {
          container.remove();
        }
      });
      
      console.log('Adding delete button to container');
      container.appendChild(deleteBtn);
    };

    // Image selection - fix event handling
    const handleImageClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Image clicked, current selection:', isSelected);
      
      // Clear other selections first
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
      
      // Toggle selection state
      isSelected = !isSelected;
      img.style.border = isSelected ? '2px solid #0077B5' : '2px solid transparent';
      
      console.log('Image selection toggled to:', isSelected);
      
      if (isSelected) {
        createResizeHandles();
        console.log('Resize handles created');
      } else {
        const container = img.parentElement;
        if (container) {
          container.querySelectorAll('.resize-handle, .image-delete-btn').forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        }
      }
    };
    
    img.addEventListener('click', handleImageClick);
    img.addEventListener('mousedown', (e) => {
      // Prevent text selection when clicking on image
      e.preventDefault();
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

    // Improved drag functionality - make container draggable instead
    const imageContainer = img.parentElement;
    if (imageContainer) {
      imageContainer.draggable = true;
      imageContainer.addEventListener('dragstart', (e) => {
        isDragging = true;
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/html', imageContainer.outerHTML);
          e.dataTransfer.effectAllowed = 'move';
        }
      });

      imageContainer.addEventListener('dragend', () => {
        isDragging = false;
      });
    }

    // Initial setup - don't create handles by default, only on selection
    // createResizeHandles();
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
        onKeyDown={(e) => {
          // For special formatting keys, prevent default and handle manually
          if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
            e.preventDefault();
            const command = e.key === 'b' ? 'bold' : e.key === 'i' ? 'italic' : 'underline';
            execCommand(command);
          }
        }}

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