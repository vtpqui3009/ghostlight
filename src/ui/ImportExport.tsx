import { useRef, useState } from 'react';

interface ImportExportProps {
  onImport: (json: string) => { success: true } | { success: false; errors: string[] };
  onExport: () => string;
}

export function ImportExport({ onImport, onExport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const result = onImport(json);
      if (!result.success) {
        setImportError(result.errors.join('; '));
        setTimeout(() => setImportError(null), 8000);
      } else {
        setImportError(null);
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const json = onExport();
    if (!json) return;
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghostlight-scene-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button onClick={handleImportClick} className="small">Import JSON</button>
      <button onClick={handleExport} className="small">Export JSON</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Import scene JSON file"
      />
      {importError && (
        <div style={{ 
          position: 'fixed', 
          top: '5rem', 
          right: '1rem', 
          maxWidth: '400px', 
          padding: '1rem', 
          background: 'var(--error)', 
          color: 'white', 
          borderRadius: '4px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}>
          <strong>Import Failed:</strong><br />
          {importError}
        </div>
      )}
    </>
  );
}
