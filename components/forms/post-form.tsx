"use client";

import React from "react";
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

// import "@uiw/react-md-editor/markdown-editor.css";
// import "@uiw/react-markdown-preview/markdown.css";

// Lazy load because it uses window
// const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
import { CreatePostFormValues, CreatePostSchema, PostStatus, PostType, PostTargetType } from "@/schemas";
import { PostRichTextEditor } from "../ui";

interface PostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PostForm({ onSuccess, onCancel }: PostFormProps) {

  const { upload, uploading, progress, asset } = useUploadAndConfirm();

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(CreatePostSchema),
    defaultValues: {
      status: PostStatus.DRAFT,
      type: PostType.BLOG,
      targetType: PostTargetType.TENANT,
    },
  });

  async function onSubmit(values: CreatePostFormValues) {
    try {
      const payload = { ...values, heroImageId: asset?.id };
      await api.post("/posts", payload);
      toast.success("Post created successfully!");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create post");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="slug">Slug (optional)</Label>
        <Input id="slug" {...form.register("slug")} />
      </div>

      {/* Excerpt */}
      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Input id="excerpt" {...form.register("excerpt")} />
      </div>
      {/* Content */}
      <div>
        <Label>Content</Label>
        {/* The content field must now store a JSON string.
          Since you're using react-hook-form, you pass the value and the setter.
        */}
        <PostRichTextEditor
          initialContent={form.watch("content") || undefined} // Pass the current value
          onChange={(val) => form.setValue("content", val, { shouldValidate: true })} // Update the form value with the JSON string
        />
        {/* Optional: Add form error display here */}
      </div>
      {/* Type */}
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

      {/* Status */}
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

      {/* Scheduled date */}
      {form.watch("status") === PostStatus.SCHEDULED && (
        <div>
          <Label htmlFor="scheduledAt">Publish At</Label>
          <Input type="datetime-local" id="scheduledAt" {...form.register("scheduledAt")} />
        </div>
      )}

      {/* Hero Image */}
      <div>
        <Label>Hero Image</Label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            if (e.target.files?.[0]) {
              await upload(e.target.files[0]);
            }
          }}
        />
        {uploading && <p>Uploading... {progress}%</p>}
        {asset && (
          <div className="mt-2">
            <Image src={asset.url} alt="Hero" width={400} height={200} className="rounded" />
          </div>
        )}
      </div>

      {/* Target Type */}
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

      {/* Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Post"}
        </Button>
      </div>
    </form>
  );
}
