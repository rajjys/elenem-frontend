import React from 'react';

type CodeBlockProps = {
  method: string;
  url: string;
  params?: string;
  responseCode: number;
  responseJson: object;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ method, url, params, responseCode, responseJson }) => {
  return (
    <div className="rounded-xl p-4 text-sm font-mono overflow-x-auto">
      <div className="mb-2">
        <span className="inline-block px-2 py-1 rounded bg-accent-soft text-accent-text font-semibold">
          {method.toUpperCase()}
        </span>
        <span className="ml-2 text-ink ">{url}</span>
      </div>

      {params && (
        <div className="mb-2 text-ink-muted ">
          <span className="font-semibold">Params:</span> {params}
        </div>
      )}

      <div className="mb-2">
        <span className="font-semibold text-positive ">{responseCode} OK</span>
      </div>

      <pre className="bg-surface-sunk rounded-md p-2 text-xs leading-relaxed text-ink whitespace-pre-wrap break-words">
        {JSON.stringify(responseJson, null, 2)}
      </pre>
    </div>
  );
};
