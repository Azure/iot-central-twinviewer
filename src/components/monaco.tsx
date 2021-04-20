import './monaco.css';
import Editor from "@monaco-editor/react";

import React from 'react';

function Monaco({ data, size, onChange }: { data: any, size: 'full' | 'medium' | 'small', onChange?: any }) {

    const [jsonData, setJsonData] = React.useState<any>();

    React.useEffect(() => {
        if (typeof data === 'object' && data !== null) {
            setJsonData(JSON.stringify(data, null, 2));
        } else {
            setJsonData(data);
        }
    }, [data]);

    const change = (value: any) => {
        onChange(value)
    }

    return <div className={'monaco monaco-' + size}>
        <Editor options={{
            renderLineHighlight: 'none',
            wordWrap: 'on',
            formatOnType: true,
            lineNumbers: 'off',
            minimap: { enabled: false },
            glyphMargin: false,
            disableLayerHinting: true,
            highlightActiveIndentGuide: false,
            matchBrackets: 'never',
            renderIndentGuides: false
        }}
            onChange={change}
            language="json"
            defaultValue={jsonData}
            value={jsonData}
        />
    </div >
}

export default Monaco