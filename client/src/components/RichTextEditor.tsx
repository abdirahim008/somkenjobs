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
                  quill.insertEmbed(range.index, 'image', base64);
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