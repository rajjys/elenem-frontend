import { useState, useCallback } from "react";
import { uploadAndConfirm, Asset } from "@/utils/upload";

export function useUploadAndConfirm() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<unknown>(null);

  const upload = useCallback(async (file: File): Promise<Asset | null> => {
    setError(null);
    try {
      const result = await uploadAndConfirm(file, {
        onUploadingChange: setUploading,
        onProgress: setProgress,
        onSuccess: setAsset,
        onError: setError,
      });
      return result;
    } catch (err) {
      setError(err);
      return null;
    }
  }, []);

  return {
    upload,
    uploading,
    progress,
    asset,
    error,
  };
}
