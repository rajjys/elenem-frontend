"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useUploadAndConfirm } from "@/hooks/useUploadAndConfirm";
import { api } from "@/services/api";
import { toast } from "sonner";
import Image from "next/image";
import slugify from 'slugify'; // For generating slugs

// Import your schemas and types (assuming they are correctly updated as in the conceptual file)
// Note: We use the DTO interface from the conceptual schema file for typing
import { CreatePostFormValues, CreatePostSchema, UpdatePostSchema, PostStatus, PostType, PostTargetType, PostResponseDto, UpdatePostFormValues } from "@/schemas";
import { flattenErrors } from "@/utils";
//import PostRichTextEditor from "../ui/post/post-rich-text-editor";
import { TextArea } from "../ui";
import PostRichTextEditor from "../ui/post/post-rich-text-editor";

// 1. Update props to accept optional initial data
interface PostFormProps {
  initialData?: PostResponseDto; // Post data for editing
  onSuccess: () => void;
  onCancel: () => void;
}

// Helper to format Date for input[type="datetime-local"]
const formatDateForInput = (dateString?: string) => {
    if (!dateString) return undefined;
    try {
        // Ensure it's a valid Date object before formatting
        return new Date(dateString).toISOString().slice(0, 16);
    } catch {
        return undefined;
    }
}

// 2. Refactor PostForm to handle both modes
export function PostForm({ initialData, onSuccess, onCancel }: PostFormProps) {
  // Determine if we are in Edit mode
  const isEditMode = !!initialData?.id;

  // useUploadAndConfirm handles new uploads, 'asset' is the newly uploaded image.
  const { upload, uploading, progress, asset } = useUploadAndConfirm();
  
  // Define default values based on mode
  const defaultValues = isEditMode
    ? {
        title: initialData.title || "",
        slug: initialData.slug || "",
        excerpt: initialData.excerpt || "",
        // 🚨 IMPORTANT: Prefer richContent for the editor, fallback to legacy content
        richContent: initialData.richContent || initialData.content ? JSON.stringify(initialData.richContent || { root: { children: [{ children: [], format: "", indent: 0, type: "paragraph", version: 1 }], direction: null, format: "", type: "root", version: 1 } }) : undefined,
        content: initialData.content || "", // Keep the legacy field populated just in case
        type: initialData.type,
        status: initialData.status,
        targetType: initialData.targetType,
        targetId: initialData.targetId || undefined,
        scheduledAt: formatDateForInput(initialData.scheduledAt),
        // heroImageId is managed by the upload logic below
      }
    : {
        // Create mode defaults
        status: PostStatus.DRAFT,
        type: PostType.BLOG,
        targetType: PostTargetType.TENANT,
        // Ensure richContent has an initial empty root structure for Lexical
        richContent: JSON.stringify({ root: { children: [{ children: [], format: "", indent: 0, type: "paragraph", version: 1 }], direction: null, format: "", type: "root", version: 1 } }),
        content: "",
      };

  const form = useForm<CreatePostFormValues | UpdatePostFormValues>({
    // Use the appropriate schema: CreatePostSchema for create, UpdatePostSchema for edit
    resolver: zodResolver(isEditMode ? UpdatePostSchema : CreatePostSchema),
    defaultValues: defaultValues, // Cast to any because the types are slightly different
  });
  
  // Watch the image input (if a NEW image is uploaded, 'asset' will be populated)
  const uploadedAsset = asset;
  
  // The current active hero image ID, prioritizing new upload over existing data
  const currentHeroImageId = uploadedAsset?.id || initialData?.heroImageId;

  // 3. Update onSubmit logic (POST vs. PUT)
  async function onSubmit(values: CreatePostFormValues | UpdatePostFormValues) {
    try {
      // Build the payload, overriding the image ID if a new asset was uploaded
      if (!values.title) return; // Basic safeguard
      const payload = { 
        ...values, 
        slug: slugify(values.title, { lower: true, strict: true }),
        heroImageId: currentHeroImageId || null // Ensure null is sent if removed/empty
      };

      if (isEditMode && initialData?.id) {
        // UPDATE: PUT request
        await api.put(`/posts/${initialData.id}`, payload);
        toast.success("Post updated successfully!");
      } else {
        // CREATE: POST request
        await api.post("/posts", payload);
        toast.success("Post created successfully!");
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} post`);
    }
  }

  // 4. Determine button text
  const buttonText = isEditMode ? "Update Post" : "Create Post";

  // Display the existing hero image if no new file is being uploaded
  const existingImage = !uploadedAsset && initialData?.heroImage?.url;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Monitor */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded">
          <h4 className="text-red-700 font-semibold mb-2">Veuillez corriger ces erreurs:</h4>
          <ul className="list-disc pl-5 text-red-600 text-sm">
            {
              flattenErrors(form.formState.errors).map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Title */}
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" {...form.register("title")} />
      </div>

      {/* Excerpt */}
      <div>
        <Label htmlFor="excerpt">Extrait</Label>
        <TextArea id="exceprt" rows={2} maxLength={120} {...form.register("excerpt")} />
      </div>
      
      {/* Rich Content Editor */}
      <div>
        <Label>Contenu</Label>
        {/* 🚨 IMPORTANT: Using richContent field now */}
        <PostRichTextEditor
          initialContent={form.watch("richContent") || undefined} 
          onChange={(val) => form.setValue("richContent", val, { shouldValidate: true })} 
        />
        {form.formState.errors.richContent && (
            <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.richContent.message as string}
            </p>
        )}
      </div>
      {/* Hero Image */}
      <div>
        <Label htmlFor="heroImage">Hero Image</Label>
        
        <label
          htmlFor="heroImage"
          className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded cursor-pointer hover:bg-indigo-600 transition-colors duration-300">
          Select Image
        </label>
        
        <input
          id="heroImage"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            if (e.target.files?.[0]) {
              await upload(e.target.files[0]);
            }
          }}
        />

        {uploading && (
          <p className="text-sm mt-1 text-slate-600">Uploading... {progress}%</p>
        )}

        {(uploadedAsset || existingImage) && (
          <div className="mt-2">
            <Image
              src={uploadedAsset?.url || initialData?.heroImage?.url || ""}
              alt="Hero"
              width={400}
              height={280}
              className="rounded object-cover h-84 w-full border border-gray-200 shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current Image ID: {currentHeroImageId}
            </p>
          </div>
        )}
      </div>

      {/* Type & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(val) => form.setValue("type", val as PostType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PostType).map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(val) => form.setValue("status", val as PostStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PostStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scheduled date */}
      {form.watch("status") === PostStatus.SCHEDULED && (
        <div>
          <Label htmlFor="scheduledAt">Publish At</Label>
          <Input type="datetime-local" id="scheduledAt" {...form.register("scheduledAt")} />
        </div>
      )}
      {/* Target Type & ID */}
      <div className="grid grid-cols-2 gap-4">
        <div>
            <Label>Target Scope</Label>
            <Select
                value={form.watch("targetType")}
                onValueChange={(val: PostTargetType) => form.setValue("targetType", val)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="TENANT">Tenant</SelectItem>
                    <SelectItem value="LEAGUE">League</SelectItem>
                    <SelectItem value="TEAM">Team</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {form.watch("targetType") !== "TENANT" && (
            <div>
                <Label htmlFor="targetId">Target ID</Label>
                <Input id="targetId" {...form.register("targetId")} />
            </div>
        )}
      </div>


      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
            type="submit" 
            disabled={form.formState.isSubmitting || uploading}
        >
          {form.formState.isSubmitting ? `${isEditMode ? "Updating" : "Creating"}...` : buttonText}
        </Button>
      </div>
    </form>
  );
}
