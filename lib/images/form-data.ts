/** Extract an uploaded image from FormData across File/Blob server-action shapes. */
export function getImageFileFromFormData(
  formData: FormData,
  fieldName = "file",
): File | null {
  const value = formData.get(fieldName);
  if (!value || typeof value === "string") return null;

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    if (value.size <= 0) return null;
    if (typeof File !== "undefined" && value instanceof File) {
      return value;
    }
    const type = value.type || "image/jpeg";
    const extension =
      type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    return new File([value], `image.${extension}`, {
      type,
      lastModified: Date.now(),
    });
  }

  // Fallback for runtimes where instanceof Blob fails across realms.
  const maybe = value as { size?: number; type?: string; name?: string };
  if (typeof maybe.size === "number" && maybe.size > 0) {
    return new File([value as Blob], maybe.name || "image.jpg", {
      type: maybe.type || "image/jpeg",
      lastModified: Date.now(),
    });
  }

  return null;
}
