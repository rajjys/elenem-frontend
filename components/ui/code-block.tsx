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
        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold">
          {method.toUpperCase()}
        </span>
        <span className="ml-2 text-slate-700 dark:text-slate-300">{url}</span>
      </div>

      {params && (
        <div className="mb-2 text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Params:</span> {params}
        </div>
      )}

      <div className="mb-2">
        <span className="font-semibold text-green-600 dark:text-green-400">{responseCode} OK</span>
      </div>

      <pre className="bg-slate-100 dark:bg-slate-800 rounded-md p-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
        {JSON.stringify(responseJson, null, 2)}
      </pre>
    </div>
  );
};
