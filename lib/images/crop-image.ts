export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlipState = {
  horizontal: boolean;
  vertical: boolean;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Nie udało się wczytać zdjęcia do edycji.")),
    );
    // Same-origin app routes don't need CORS; blob: URLs must stay unset.
    if (url.startsWith("http://") || url.startsWith("https://")) {
      image.crossOrigin = "anonymous";
    }
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function extensionForMime(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "jpg";
}

function resolveOutputMime(contentType?: string | null) {
  if (
    contentType === "image/png" ||
    contentType === "image/webp" ||
    contentType === "image/jpeg" ||
    contentType === "image/jpg"
  ) {
    return contentType === "image/jpg" ? "image/jpeg" : contentType;
  }
  return "image/jpeg";
}

async function drawTransformedImage(
  imageSrc: string,
  rotation: number,
  flip: FlipState,
): Promise<HTMLCanvasElement> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Nie udało się przygotować edycji zdjęcia.");
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  canvas.width = Math.max(1, Math.round(bBoxWidth));
  canvas.height = Math.max(1, Math.round(bBoxHeight));

  try {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);
  } catch {
    throw new Error(
      "Nie można wyeksportować zdjęcia (problem z odczytem obrazu).",
    );
  }

  return canvas;
}

/** Bake rotation/flip into a blob URL for accurate on-image crop selection. */
export async function createTransformedObjectUrl(
  imageSrc: string,
  options?: {
    rotation?: number;
    flip?: FlipState;
    contentType?: string | null;
  },
): Promise<string> {
  const rotation = options?.rotation ?? 0;
  const flip = options?.flip ?? { horizontal: false, vertical: false };
  if (
    rotation === 0 &&
    !flip.horizontal &&
    !flip.vertical
  ) {
    return imageSrc;
  }

  const canvas = await drawTransformedImage(imageSrc, rotation, flip);
  const mimeType = resolveOutputMime(options?.contentType);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Nie udało się przygotować podglądu edycji."));
          return;
        }
        resolve(result);
      },
      mimeType,
      mimeType === "image/jpeg" ? 0.92 : undefined,
    );
  });
  return URL.createObjectURL(blob);
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: PixelCrop,
  options?: {
    rotation?: number;
    flip?: FlipState;
    contentType?: string | null;
    fileName?: string | null;
  },
): Promise<File> {
  const rotation = options?.rotation ?? 0;
  const flip = options?.flip ?? { horizontal: false, vertical: false };
  const canvas = await drawTransformedImage(imageSrc, rotation, flip);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) {
    throw new Error("Nie udało się przygotować edycji zdjęcia.");
  }

  const width = Math.max(1, Math.round(pixelCrop.width));
  const height = Math.max(1, Math.round(pixelCrop.height));
  croppedCanvas.width = width;
  croppedCanvas.height = height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  const mimeType = resolveOutputMime(options?.contentType);
  const blob = await new Promise<Blob>((resolve, reject) => {
    croppedCanvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Nie udało się zapisać edytowanego zdjęcia."));
          return;
        }
        resolve(result);
      },
      mimeType,
      mimeType === "image/jpeg" ? 0.92 : undefined,
    );
  });

  const baseName = (options?.fileName || "edited-image").replace(
    /\.[^.]+$/,
    "",
  );
  return new File([blob], `${baseName}.${extensionForMime(mimeType)}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
