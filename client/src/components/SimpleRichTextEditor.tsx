import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image, Table, Minus, Grid, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAllowedContentImageSrc } from '@shared/utils';

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
  const savedImageRangeRef = useRef<Range | null>(null);
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
    if (!editorRef.current) return;
    
    const cursorOffset = getCursorOffset();
    
    // Handle special commands that need different approach
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      // For lists, we need to ensure proper DOM focus first
      editorRef.current.focus();
      document.execCommand(command, false, value);
      
      // Apply some basic styling to lists to make them visible
      setTimeout(() => {
        if (editorRef.current) {
          const lists = editorRef.current.querySelectorAll('ul, ol');
          lists.forEach(list => {
            (list as HTMLElement).style.paddingLeft = '20px';
            (list as HTMLElement).style.margin = '10px 0';
            if (list.tagName === 'UL') {
              (list as HTMLElement).style.listStyleType = 'disc';
            } else {
              (list as HTMLElement).style.listStyleType = 'decimal';
            }
          });
        }
      }, 100);
    } else {
      // For other commands, use normal execution
      document.execCommand(command, false, value);
      editorRef.current.focus();
    }
    
    // Small delay to ensure DOM is updated before restoring position
    setTimeout(() => setCursorOffset(cursorOffset), 50);
  };

  // Clean pasted HTML preserving table structure
  const cleanPastedHTMLWithTables = (html: string): string => {
    // Strip MS Office XML, comments, styles, head section
    const preprocessed = html
      .replace(/<\?xml[^>]*>/gi, '')
      .replace(/<!--[\s\S]*?-->/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<o:[^>]*\/>/gi, '')
      .replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '')
      .replace(/<w:[^>]*\/>/gi, '')
      .replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '')
      .replace(/<m:[^>]*\/>/gi, '')
      .replace(/<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, '');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = preprocessed;

    // If clipboard wrapped content in <html><body>, extract body content
    const body = tempDiv.querySelector('body');
    const root = body || tempDiv;

    // Style all tables cleanly (querySelectorAll searches all descendants)
    root.querySelectorAll('table').forEach(table => {
      table.removeAttribute('class');
      table.removeAttribute('style');
      (table as HTMLElement).style.cssText = 'border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ccc;';
      table.querySelectorAll('tr').forEach(tr => {
        tr.removeAttribute('class');
        tr.removeAttribute('style');
      });
      table.querySelectorAll('td, th').forEach(cell => {
        const el = cell as HTMLElement;
        const isTh = cell.tagName === 'TH';
        // Keep colspan/rowspan but remove class/style
        el.removeAttribute('class');
        el.removeAttribute('style');
        el.style.cssText = `border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top;${isTh ? ' font-weight: bold; background-color: #f5f5f5;' : ''}`;
        // Clean spans inside cells (MS Office adds many)
        el.querySelectorAll('span').forEach(span => {
          span.removeAttribute('class');
          span.removeAttribute('style');
        });
      });
    });

    // Clean non-table elements: strip classes/styles but preserve text and basic tags (p, br, b, strong, etc.)
    const cleanElement = (el: Element) => {
      const tag = el.tagName;
      if (['TABLE','THEAD','TBODY','TFOOT','TR','TD','TH'].includes(tag)) return;
      el.removeAttribute('class');
      el.removeAttribute('style');
      el.removeAttribute('lang');
      el.removeAttribute('dir');
      el.removeAttribute('id');
      Array.from(el.children).forEach(cleanElement);
    };
    Array.from(root.children).forEach(cleanElement);

    return root.innerHTML;
  };

  // Convert pasted HTML (Word, web pages) to plain text with ONE line per
  // paragraph/list item. Word's clipboard HTML hard-wraps its source at ~80
  // characters; those newlines are whitespace inside a paragraph, not breaks,
  // so they are collapsed while real paragraph boundaries are kept.
  const htmlToParagraphText = (html: string): string => {
    const preprocessed = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<\?xml[^>]*>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<!--[\s\S]*?-->/gi, '')
      .replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '')
      .replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '')
      .replace(/<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, '');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = preprocessed;

    const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TR', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER']);
    const lines: string[] = [];
    let current = '';
    const flush = () => {
      if (current.trim() !== '') lines.push(current);
      current = '';
    };
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        current += node.textContent || '';
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = (node as Element).tagName;
      if (tag === 'BR') {
        lines.push(current);
        current = '';
        return;
      }
      if (!BLOCK_TAGS.has(tag)) {
        node.childNodes.forEach(walk);
        return;
      }
      flush();
      const linesBefore = lines.length;
      if (tag === 'LI') current = '• ';
      node.childNodes.forEach(walk);
      // An empty paragraph is deliberate spacing in Word: keep it as a blank line.
      if ((tag === 'P' || tag === 'DIV') && lines.length === linesBefore && current.trim() === '') {
        lines.push('');
        current = '';
      } else {
        flush();
      }
    };
    tempDiv.childNodes.forEach(walk);
    flush();

    const result: string[] = [];
    lines
      .map(line =>
        line
          .replace(/\s+/g, ' ') // collapses Word's source wrapping, tabs and nbsp
          .trim()
          // Word list bullets arrive as a Symbol-font "·" / "§" plus padding
          .replace(/^[·§▪◦]\s+/, '• ')
      )
      .forEach(line => {
        // keep at most one blank line in a row, none at the start
        if (line === '' && (result.length === 0 || result[result.length - 1] === '')) return;
        result.push(line);
      });
    while (result.length && result[result.length - 1] === '') result.pop();
    return result.join('\n');
  };

  // Text copied from PDFs (and some viewers) has a hard line break at the end
  // of every visual line, which pastes as short ragged lines. Re-join such
  // lines into full-width paragraphs. Only applied when the text clearly looks
  // hard-wrapped, so normal one-line-per-paragraph text is left untouched.
  const reflowHardWrappedText = (text: string): string => {
    const lines = text.replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/\s+$/, ''));
    const content = lines.map(l => l.trim()).filter(Boolean);
    if (content.length < 3) return text;

    const sorted = content.map(l => l.length).sort((a, b) => a - b);
    const typicalWidth = sorted[Math.floor(sorted.length * 0.8)];
    if (typicalWidth < 40) return text;

    const fullWidth = (l: string) => l.length >= typicalWidth * 0.75;
    const endsSentence = (l: string) => /[.!?:]["'”’)\]]?$/.test(l);
    const startsListItem = (l: string) => /^([•·▪◦‣\-–*]|\(?\d{1,3}[.)]|\(?[a-zA-Z][.)])\s+/.test(l);

    const wrappedLooking = content.filter(l => fullWidth(l) && !endsSentence(l)).length;
    if (wrappedLooking < Math.max(2, content.length * 0.3)) return text;

    const out: string[] = [];
    let prevRaw = '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        out.push('');
        prevRaw = '';
        continue;
      }
      const join = prevRaw !== '' && fullWidth(prevRaw) && !endsSentence(prevRaw) && !startsListItem(line);
      if (join) {
        const last = out[out.length - 1];
        // "non-" + "governmental" -> "non-governmental"
        out[out.length - 1] = /[A-Za-z]-$/.test(last) ? last + line : `${last} ${line}`;
      } else {
        out.push(line);
      }
      prevRaw = line;
    }
    return out.join('\n');
  };

  // Insert an HTML string at the current cursor position using Range API (more reliable than execCommand)
  const insertHTMLAtCursor = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Parse the HTML into real DOM nodes via a fragment
    const fragment = document.createRange().createContextualFragment(html);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    // Move cursor to just after the inserted content
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // Notify React of the change
    if (editorRef.current.innerHTML !== lastContentRef.current) {
      lastContentRef.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle paste events - smart detection of tables and images
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const clipboardData = e.clipboardData;

    // 1. Check for a pasted image (screenshot or copy from image viewer)
    const items = Array.from(clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    if (imageItem) {
      const blob = imageItem.getAsFile();
      if (blob) {
        insertImageFile(blob, captureEditorRange());
        return;
      }
    }

    // 2. Check for HTML with tables — preserve structure
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    if (htmlData && /<table[\s\S]*?>/i.test(htmlData)) {
      const cleanedHTML = cleanPastedHTMLWithTables(htmlData);
      insertHTMLAtCursor(cleanedHTML);
      // Make pasted tables interactive
      requestAnimationFrame(() => {
        editorRef.current?.querySelectorAll('table:not([data-interactive])').forEach(table => {
          table.setAttribute('data-interactive', 'true');
          styleTable(table as HTMLTableElement);
          makeTableInteractive(table as HTMLTableElement);
        });
      });
      return;
    }

    // 3. Other HTML (e.g. Word) — clean text, one line per paragraph, each
    //    paragraph flowing to the full width. Falls back to plain text.
    const pastedText = htmlData ? htmlToParagraphText(htmlData) || textData : textData;
    if (pastedText) {
      document.execCommand('insertText', false, reflowHardWrappedText(pastedText));
    }
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

  // Saved images come back without the editor's inline styles/handlers
  const prepareLoadedImages = () => {
    requestAnimationFrame(() => {
      editorRef.current?.querySelectorAll('img').forEach(node => {
        const img = node as HTMLImageElement;
        if (img.dataset.interactive) return;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.cursor = 'pointer';
        img.style.border = '2px solid transparent';
        const width = parseInt(img.getAttribute('width') || '', 10);
        if (width > 0) img.style.width = width + 'px';
        img.dataset.interactive = 'true';
        makeImageInteractive(img);
      });
    });
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
      lastContentRef.current = value || '';
      prepareLoadedImages();
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
        prepareLoadedImages();
        
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
    const hStyle = `border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; vertical-align: top; position: relative; min-width: 60px; background-color: #f0f4f8; font-weight: 600; color: #1e3a5f; border-bottom: 2px solid #d1d5db;`;
    const cStyle = `border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; vertical-align: top; position: relative; min-width: 60px;`;
    const c2Style = `border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; vertical-align: top; position: relative; min-width: 60px; background-color: #fafafa;`;
    const tableHTML = `<table id="${tableId}" style="border-collapse: collapse; width: 100%; margin: 14px 0; border: 1px solid #d1d5db; overflow: hidden; table-layout: auto; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 3px rgba(0,0,0,0.08);"><tr><td style="${hStyle}">Header 1</td><td style="${hStyle}">Header 2</td><td style="${hStyle}">Header 3</td></tr><tr><td style="${cStyle}"></td><td style="${cStyle}"></td><td style="${cStyle}"></td></tr><tr><td style="${c2Style}"></td><td style="${c2Style}"></td><td style="${c2Style}"></td></tr></table>`;
    insertHTMLAtCursor(tableHTML);
    
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
    const isEven = table.rows.length % 2 === 0;
    
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('td');
      cell.style.cssText = `border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; vertical-align: top; position: relative; min-width: 60px; background-color: ${isEven ? '#fafafa' : '#ffffff'};`;
      cell.textContent = '';
      newRow.appendChild(cell);
    }
    
    table.appendChild(newRow);
  };

  const addTableColumn = (table: HTMLTableElement) => {
    const rows = table.querySelectorAll('tr');
    const hasThCells = table.querySelectorAll('th').length > 0;
    rows.forEach((row, rowIndex) => {
      const isHeader = rowIndex === 0 && !hasThCells;
      const cell = document.createElement('td');
      cell.style.cssText = `border: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; vertical-align: top; position: relative; min-width: 60px; ${isHeader ? 'background-color: #f0f4f8; font-weight: 600; color: #1e3a5f; border-bottom: 2px solid #d1d5db;' : rowIndex % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #ffffff;'}`;
      cell.textContent = '';
      row.appendChild(cell);
    });
  };

  const styleTable = (table: HTMLTableElement) => {
    // Apply polished table styling — auto column widths based on content
    table.style.cssText = `
      border-collapse: collapse;
      width: 100%;
      margin: 14px 0;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      table-layout: auto;
      border-spacing: 0;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    `;

    // Detect if there's a header row (first row or any <th> elements)
    const rows = table.querySelectorAll('tr');
    const firstRow = rows[0];
    const hasThCells = table.querySelectorAll('th').length > 0;

    // Style all cells
    const cells = table.querySelectorAll('td, th');
    cells.forEach((cell) => {
      const htmlCell = cell as HTMLElement;
      const row = cell.parentElement as HTMLTableRowElement;
      const rowIndex = row ? row.rowIndex : -1;
      const isHeader = cell.tagName === 'TH' || (rowIndex === 0 && !hasThCells);
      const isEvenRow = rowIndex % 2 === 0;

      htmlCell.style.cssText = `
        border: 1px solid #e5e7eb;
        padding: 10px 14px;
        text-align: left;
        vertical-align: top;
        position: relative;
        white-space: normal;
        word-break: break-word;
        min-width: 60px;
        ${isHeader
          ? 'background-color: #f0f4f8; font-weight: 600; color: #1e3a5f; border-bottom: 2px solid #d1d5db; letter-spacing: 0.01em;'
          : isEvenRow
          ? 'background-color: #fafafa;'
          : 'background-color: #ffffff;'
        }
      `;

      // Add resize handle to each cell
      addCellResizeHandle(htmlCell);
    });
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
      insertImageFile(file, savedImageRangeRef.current);
      savedImageRangeRef.current = null;
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Current cursor position, if it is inside the editor
  const captureEditorRange = (): Range | null => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current) return null;
    const range = selection.getRangeAt(0);
    return editorRef.current.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
  };

  // Put the cursor back at a saved position (or at the end of the editor)
  const restoreEditorRange = (range: Range | null) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;
    editor.focus();
    let target = range && editor.contains(range.commonAncestorContainer) ? range : null;
    if (!target) {
      target = document.createRange();
      target.selectNodeContents(editor);
      target.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(target);
  };

  // Large photos are scaled down and re-encoded before upload: keeps pages
  // fast and stays under the server's ~4 MB request limit.
  const MAX_IMAGE_WIDTH = 1600;
  const prepareImageForUpload = (file: Blob): Promise<{ blob: Blob; name: string }> => {
    const originalName = (file as File).name || 'image.png';
    const base = (originalName.replace(/\.[^.]+$/, '') || 'image').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 60) || 'image';
    const typeExt: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
    const ext = typeExt[file.type];

    return new Promise((resolve, reject) => {
      // GIFs are uploaded as-is so animations survive
      if (ext === 'gif') return resolve({ blob: file, name: `${base}.gif` });

      const url = URL.createObjectURL(file);
      const image = new window.Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        const needsResize = image.naturalWidth > MAX_IMAGE_WIDTH;
        const smallEnough = file.size <= 1.5 * 1024 * 1024;
        if (ext && !needsResize && smallEnough) {
          return resolve({ blob: file, name: `${base}.${ext}` });
        }
        const scale = Math.min(1, MAX_IMAGE_WIDTH / image.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not process image'));
        ctx.fillStyle = '#ffffff'; // transparent areas become white, not black
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve({ blob, name: `${base}.jpg` }) : reject(new Error('Could not process image'))),
          'image/jpeg',
          0.85,
        );
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('This image format is not supported. Please use PNG or JPG.'));
      };
      image.src = url;
    });
  };

  const uploadImage = async (blob: Blob, name: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, name);
    const token = localStorage.getItem('auth_token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) throw new Error(res.status === 413 ? 'The image is too large.' : 'Upload failed.');
    const data = await res.json();
    if (!data?.url || !isAllowedContentImageSrc(data.url)) throw new Error('Upload failed.');
    return data.url as string;
  };

  // Images are uploaded to file storage and referenced by URL; embedding the
  // image data in the description would be stripped when the job is saved.
  const insertImageFile = async (file: Blob, range: Range | null) => {
    const uploadId = `upload_${Date.now()}`;
    restoreEditorRange(range);
    insertHTMLAtCursor(
      `<span data-upload-id="${uploadId}" contenteditable="false" style="display: inline-block; padding: 4px 10px; margin: 6px 0; border-radius: 4px; background: #f0f4f8; color: #1e3a5f; font-size: 13px;">Uploading image…</span>`
    );
    const placeholder = () => editorRef.current?.querySelector(`[data-upload-id="${uploadId}"]`) as HTMLElement | null;

    try {
      const { blob, name } = await prepareImageForUpload(file);
      const url = await uploadImage(blob, name);
      const marker = placeholder();
      if (!marker) return; // user deleted the placeholder while uploading
      const imgId = `img_${Date.now()}`;
      const container = document.createElement('div');
      container.innerHTML = `<div class="image-container" style="position: relative; display: inline-block; margin: 10px 0; min-height: 50px;"><img id="${imgId}" src="${url}" alt="" style="max-width: 100%; height: auto; border: 2px solid transparent; border-radius: 4px; cursor: pointer; display: block; user-select: none;" draggable="false" /></div>`;
      marker.replaceWith(container.firstChild as Node);
      syncEditorContent();
      const img = document.getElementById(imgId) as HTMLImageElement | null;
      if (img) {
        img.dataset.interactive = 'true';
        makeImageInteractive(img);
        fitImageToEditorWidth(img);
      }
    } catch (error) {
      placeholder()?.remove();
      syncEditorContent();
      alert(`Could not add the image. ${(error as Error)?.message || ''} Please try again.`.trim());
    }
  };

  // Width available for content inside the editor (excludes its 12px padding)
  const getEditorContentWidth = (): number => {
    const el = editorRef.current;
    return el ? Math.max(100, el.clientWidth - 24) : 600;
  };

  // Push DOM-only changes (e.g. image resizing) back to the parent form
  const syncEditorContent = () => {
    if (editorRef.current && editorRef.current.innerHTML !== lastContentRef.current) {
      lastContentRef.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  };

  // New images fill the editor width by default; images smaller than that
  // keep their own size so they are not blown up and blurred.
  // The width attribute is what is saved with the job (inline styles are
  // stripped on save); the inline style drives the editor display.
  const setImageWidth = (img: HTMLImageElement, width: number | null) => {
    if (width === null) {
      img.style.width = 'auto';
      img.removeAttribute('width');
    } else {
      const px = Math.round(width);
      img.style.width = px + 'px';
      img.setAttribute('width', String(px));
    }
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
  };

  const fitImageToEditorWidth = (img: HTMLImageElement) => {
    const apply = () => {
      const natural = img.naturalWidth || getEditorContentWidth();
      setImageWidth(img, Math.min(natural, getEditorContentWidth()));
      syncEditorContent();
    };
    if (img.complete && img.naturalWidth) apply();
    else img.addEventListener('load', apply, { once: true });
  };

  const makeImageInteractive = (img: HTMLImageElement) => {
    let isResizing = false;
    let isSelected = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let isDragging = false;
    
    // Older images were saved with a hard 300px cap that blocked enlarging
    if (img.style.maxWidth === '300px') img.style.maxWidth = '100%';

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
            
            newWidth = Math.max(50, Math.min(getEditorContentWidth(), newWidth));
            setImageWidth(img, newWidth);
          };

          const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            syncEditorContent();
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
        { label: 'Full width', action: 'full' },
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
            setImageWidth(img, Math.min(option.width, getEditorContentWidth()));
          } else if (option.action === 'full') {
            setImageWidth(img, getEditorContentWidth());
          } else {
            setImageWidth(img, null);
          }
          syncEditorContent();
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
          onClick={() => {
            savedImageRangeRef.current = captureEditorRange();
            fileInputRef.current?.click();
          }}
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
        onPaste={handlePaste}
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