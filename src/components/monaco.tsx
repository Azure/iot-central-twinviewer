import './monaco.css';
import Editor from "@monaco-editor/react";

import React from 'react';

function Monaco({ data, size, onChange }: { data: any, size: 'full' | 'medium' | 'small', onChange?: any }) {

    // set up the data that the editor uses
    const [jsonData, setJsonData] = React.useState<any>();

    // if new data arrives, set the data variable for the editor
    React.useEffect(() => {
        if (typeof data === 'object' && data !== null) {
            setJsonData(JSON.stringify(data, null, 2));
        } else {
            setJsonData(data);
        }
    }, [data]);

    // only add an onChange handler if one is supplied
    const options = onChange ? { onChange: (value: any) => { onChange(value) } } : {};

    // render the UX
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
            {...options}
            language="json"
            defaultValue={jsonData}
            value={jsonData}
        />
    </div >
}

export default Monaco