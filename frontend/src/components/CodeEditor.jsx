import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, onChange }) {
  return (
    <div className="editor-container">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth"
        }}
      />
    </div>
  );
}
