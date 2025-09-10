'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { api } from '@/services/api';

export default function UploadTestPage() {
  const [strategy, setStrategy] = useState<'direct'|'proxy'>('direct');
  const [folder, setFolder] = useState('avatars');
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setProgress(0); setResultUrl(null); };

  async function onUpload() {
    reset();
    const file = fileRef.current?.files?.[0];
    if (!file) return alert('Choose a file');

    if (strategy === 'proxy') {
      // A) Proxy upload to NestJS
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);

      const resp = await api.post(`/uploads2/proxy`, form, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setResultUrl(resp.data.publicUrl ?? `s3-key: ${resp.data.key}`);
    } else {
      // B) Direct upload with presigned PUT
      // 1) Ask NestJS for presigned URL
      try{
            const presign = await api.post(`/uploads2/presign`, {
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            folder,
            size: file.size,
        });
      const { url, key, publicUrl } = presign.data;
      // 2) PUT directly to S3
      const res = await axios.put(url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream',
            //'x-amz-server-side-encryption': 'AES256'
         },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      console.log(res);
      setResultUrl(publicUrl ?? `s3-key: ${key}`);}
      catch(error){
        console.log(error);
      }
    }
  }

  return (
   <div className="max-w-xl mx-auto mt-10 p-6 font-sans bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-semibold text-center mb-6">Upload Tester (Proxy & Direct)</h1>

        <div className="grid gap-4">
            <label className="flex flex-col gap-1">
            <span className="font-medium">Folder (path prefix)</span>
            <input
                value={folder}
                onChange={e => setFolder(e.target.value)}
                placeholder="avatars"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            </label>

            <label className="flex flex-col gap-1">
            <span className="font-medium">Strategy</span>
            <select
                value={strategy}
                onChange={e => setStrategy(e.target.value as 'direct' | 'proxy')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="direct">Direct to S3 (presigned URL)</option>
                <option value="proxy">Proxy via NestJS</option>
            </select>
            </label>

            <input
            type="file"
            ref={fileRef}
            accept="image/*,application/pdf"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />

            <button
            onClick={onUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
            Upload
            </button>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
            />
            </div>

            {resultUrl && (
            <div className="mt-2">
                <div className="font-medium">Result:</div>
                {resultUrl.startsWith('http') ? (
                <a href={resultUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    {resultUrl}
                </a>
                ) : (
                <code className="bg-gray-100 px-2 py-1 rounded-md text-sm">{resultUrl}</code>
                )}
            </div>
            )}
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
            Tip: “Direct” is best for scale. Keep objects private and serve via CloudFront or presigned GET.
        </p>
    </div>
  );
}
