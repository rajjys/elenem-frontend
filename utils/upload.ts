import axios from "axios";
import { api } from "@/services/api";
import { toast } from "sonner";

export interface Asset {
  id: string;
  url: string;
  status: string;
  size: number;
}

interface UploadOptions {
  onProgress?: (progress: number) => void;
  onUploadingChange?: (uploading: boolean) => void;
  onSuccess?: (asset: Asset) => void;
  onError?: (err: unknown) => void;
}

export async function uploadAndConfirm(
  file: File,
  { onProgress, onUploadingChange, onSuccess, onError }: UploadOptions = {}
): Promise<Asset> {
  onUploadingChange?.(true);
  onProgress?.(0);

  try {
    const presignResp = await api.post("/uploads/presign", {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    });

    const presign = presignResp.data;
    const uploadUrl =
      presign.presignedUrl ??
      presign.url ??
      presign.uploadUrl ??
      presign.signedUrl;

    const assetId = presign.assetId ?? presign.id;
    if (!uploadUrl) throw new Error("No upload URL from presign");

    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
      onUploadProgress: (e) => {
        if (e.total) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress?.(progress);
        }
      },
    });

    const confirmResp = await api.post("/uploads/confirm", { assetId });
    const asset: Asset = confirmResp.data;

    toast.success("Upload successful");
    onSuccess?.(asset);
    return asset;
  } catch (err) {
    toast.error("Upload failed");
    onError?.(err);
    throw err;
  } finally {
    onUploadingChange?.(false);
  }
}