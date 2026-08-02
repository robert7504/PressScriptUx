"use client";

import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import FlipIcon from "@mui/icons-material/Flip";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PercentCrop,
  type PixelCrop as DisplayPixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  createTransformedObjectUrl,
  getCroppedImageFile,
  type FlipState,
  type PixelCrop,
} from "@/lib/images/crop-image";

type AspectPreset = {
  id: string;
  label: string;
  value: number | null | "free";
};

const ASPECT_PRESETS: AspectPreset[] = [
  { id: "free", label: "Dowolny", value: "free" },
  { id: "original", label: "Oryginał", value: null },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "3:4", label: "3:4", value: 3 / 4 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "9:16", label: "9:16", value: 9 / 16 },
  { id: "3:2", label: "3:2", value: 3 / 2 },
  { id: "2:3", label: "2:3", value: 2 / 3 },
];

export type ImageCropEditorHandle = {
  exportFile: () => Promise<File | null>;
  isDirty: () => boolean;
};

type ImageCropEditorProps = {
  imageSrc: string;
  fileName?: string | null;
  contentType?: string | null;
  disabled?: boolean;
};

function toNaturalPixelCrop(
  crop: DisplayPixelCrop,
  image: HTMLImageElement,
): PixelCrop {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  return {
    x: crop.x * scaleX,
    y: crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  };
}

function createInitialCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined,
): PercentCrop {
  if (aspect) {
    // Use 100% so the selection fills the largest area that fits the aspect.
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 100,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  return {
    unit: "%",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };
}

const ImageCropEditor = forwardRef<ImageCropEditorHandle, ImageCropEditorProps>(
  function ImageCropEditor(
    { imageSrc, fileName, contentType, disabled = false },
    ref,
  ) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const displaySrcRef = useRef(imageSrc);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<DisplayPixelCrop | null>(
      null,
    );
    const [rotation, setRotation] = useState(0);
    const [flip, setFlip] = useState<FlipState>({
      horizontal: false,
      vertical: false,
    });
    const [aspectId, setAspectId] = useState("free");
    const [naturalAspect, setNaturalAspect] = useState(4 / 3);
    const [displaySrc, setDisplaySrc] = useState(imageSrc);
    const [dirty, setDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [portalReady, setPortalReady] = useState(false);
    const cropRef = useRef(crop);
    cropRef.current = crop;

    displaySrcRef.current = displaySrc;

    useEffect(() => {
      setPortalReady(true);
    }, []);

    useEffect(() => {
      setCrop(undefined);
      setCompletedCrop(null);
      setRotation(0);
      setFlip({ horizontal: false, vertical: false });
      setAspectId("free");
      setDisplaySrc((prev) => {
        if (prev.startsWith("blob:") && prev !== imageSrc) {
          URL.revokeObjectURL(prev);
        }
        return imageSrc;
      });
      setDirty(false);
      setError(null);
      setExpanded(false);
    }, [imageSrc]);

    useEffect(() => {
      if (!expanded) return;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          event.preventDefault();
          setExpanded(false);
        }
      };

      window.addEventListener("keydown", onKeyDown, true);
      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", onKeyDown, true);
      };
    }, [expanded]);

    useEffect(() => {
      let cancelled = false;
      let createdUrl: string | null = null;

      async function updateDisplay() {
        try {
          const next = await createTransformedObjectUrl(imageSrc, {
            rotation,
            flip,
            contentType,
          });
          if (next.startsWith("blob:")) {
            createdUrl = next;
          }
          if (cancelled) {
            if (createdUrl) URL.revokeObjectURL(createdUrl);
            return;
          }
          setDisplaySrc((prev) => {
            if (prev.startsWith("blob:") && prev !== next) {
              URL.revokeObjectURL(prev);
            }
            return next;
          });
          setCrop(undefined);
          setCompletedCrop(null);
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Nie udało się przygotować podglądu edycji.",
            );
          }
        }
      }

      void updateDisplay();

      return () => {
        cancelled = true;
      };
    }, [imageSrc, rotation, flip, contentType]);

    useEffect(() => {
      return () => {
        const src = displaySrcRef.current;
        if (src.startsWith("blob:")) {
          URL.revokeObjectURL(src);
        }
      };
    }, []);

    const aspect = useMemo(() => {
      const preset = ASPECT_PRESETS.find((item) => item.id === aspectId);
      if (!preset || preset.value === "free") return undefined;
      return preset.value ?? naturalAspect;
    }, [aspectId, naturalAspect]);

    const markDirty = useCallback(() => {
      setDirty(true);
    }, []);

    const applyAspectCrop = useCallback(
      (nextAspect: number | undefined, image: HTMLImageElement) => {
        const next = createInitialCrop(image.width, image.height, nextAspect);
        setCrop(next);
        setCompletedCrop(convertToPixelCrop(next, image.width, image.height));
      },
      [],
    );

    const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      imgRef.current = image;
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setNaturalAspect(image.naturalWidth / image.naturalHeight);
      }

      // Keep an existing selection when the image remounts or resizes.
      const existing = cropRef.current;
      if (existing && existing.width > 0 && existing.height > 0) {
        setCompletedCrop(
          convertToPixelCrop(existing, image.width, image.height),
        );
        return;
      }

      const preset = ASPECT_PRESETS.find((item) => item.id === aspectId);
      const nextAspect =
        !preset || preset.value === "free"
          ? undefined
          : (preset.value ?? image.naturalWidth / image.naturalHeight);

      // Free mode starts empty so the user can drag-select with the mouse.
      if (nextAspect === undefined) {
        setCrop(undefined);
        setCompletedCrop(null);
        return;
      }

      applyAspectCrop(nextAspect, image);
    };

    const resetView = () => {
      setRotation(0);
      setFlip({ horizontal: false, vertical: false });
      setAspectId("free");
      setCrop(undefined);
      setCompletedCrop(null);
      setDirty(false);
      setError(null);
    };

    const exportFile = useCallback(async () => {
      const image = imgRef.current;
      if (!image) return null;

      // Prefer percent crop so export stays correct after expand/collapse resize.
      const displayPixelCrop =
        crop && crop.width > 0 && crop.height > 0
          ? convertToPixelCrop(crop, image.width, image.height)
          : completedCrop && completedCrop.width > 0 && completedCrop.height > 0
            ? completedCrop
            : null;

      const pixelCrop: PixelCrop = displayPixelCrop
        ? toNaturalPixelCrop(displayPixelCrop, image)
        : {
            x: 0,
            y: 0,
            width: image.naturalWidth,
            height: image.naturalHeight,
          };

      // Transforms are already baked into displaySrc; crop that bitmap only.
      return getCroppedImageFile(displaySrc, pixelCrop, {
        rotation: 0,
        flip: { horizontal: false, vertical: false },
        contentType,
        fileName,
      });
    }, [crop, completedCrop, displaySrc, contentType, fileName]);

    useImperativeHandle(
      ref,
      () => ({
        exportFile,
        isDirty: () => dirty,
      }),
      [exportFile, dirty],
    );

    const editor = (
      <Stack
        spacing={1.5}
        sx={
          expanded
            ? {
                height: "100%",
                minHeight: 0,
              }
            : undefined
        }
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            {expanded ? "Edycja kadru — pełny ekran" : "Edycja kadru"}
          </Typography>
          <Tooltip
            title={expanded ? "Zamknij pełny ekran" : "Rozszerz na cały ekran"}
          >
            <span>
              <IconButton
                size="small"
                onClick={() => setExpanded((prev) => !prev)}
                disabled={disabled}
                aria-label={
                  expanded ? "Zamknij pełny ekran" : "Rozszerz na cały ekran"
                }
              >
                {expanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Box
          sx={{
            width: "100%",
            flex: expanded ? 1 : undefined,
            minHeight: expanded ? 0 : undefined,
            bgcolor: "grey.900",
            borderRadius: 1,
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 1,
            // react-image-crop inherits max-height from .ReactCrop down to the img
            "& .ReactCrop": {
              maxWidth: "100%",
              maxHeight: expanded
                ? "calc(100vh - 220px)"
                : {
                    xs: "min(280px, 40vh)",
                    sm: "min(360px, 45vh)",
                  },
            },
            "& .ReactCrop img": {
              maxHeight: "inherit",
            },
          }}
        >
          <ReactCrop
            crop={crop}
            aspect={aspect}
            disabled={disabled}
            keepSelection
            ruleOfThirds
            onChange={(nextCrop, percentCrop) => {
              setCrop(percentCrop);
              if (nextCrop.width > 0 && nextCrop.height > 0) {
                markDirty();
              }
            }}
            onComplete={(nextCrop) => {
              if (nextCrop.width > 0 && nextCrop.height > 0) {
                setCompletedCrop(nextCrop);
                markDirty();
              } else {
                setCompletedCrop(null);
              }
            }}
          >
            <img
              src={displaySrc}
              alt="Kadrowanie zdjęcia"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </Box>

        <Stack
          direction="row"
          spacing={0.75}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          {ASPECT_PRESETS.map((preset) => {
            const selected = aspectId === preset.id;
            return (
              <ButtonBase
                key={preset.id}
                disabled={disabled}
                onClick={() => {
                  setAspectId(preset.id);
                  markDirty();
                  const image = imgRef.current;
                  if (!image) return;

                  const nextAspect =
                    preset.value === "free"
                      ? undefined
                      : (preset.value ?? naturalAspect);

                  if (nextAspect === undefined) {
                    return;
                  }

                  applyAspectCrop(nextAspect, image);
                }}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                  border: 1,
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected ? "action.selected" : "background.paper",
                  typography: "caption",
                  fontWeight: selected ? 600 : 400,
                  color: "text.primary",
                }}
              >
                {preset.label}
              </ButtonBase>
            );
          })}
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Tooltip title="Obróć w lewo">
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => {
                  setRotation((prev) => (prev - 90 + 360) % 360);
                  markDirty();
                }}
                aria-label="Obróć w lewo"
              >
                <RotateLeftIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Obróć w prawo">
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => {
                  setRotation((prev) => (prev + 90) % 360);
                  markDirty();
                }}
                aria-label="Obróć w prawo"
              >
                <RotateRightIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Odwróć w poziomie">
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => {
                  setFlip((prev) => ({
                    ...prev,
                    horizontal: !prev.horizontal,
                  }));
                  markDirty();
                }}
                aria-label="Odwróć w poziomie"
                color={flip.horizontal ? "primary" : "default"}
              >
                <FlipIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Odwróć w pionie">
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => {
                  setFlip((prev) => ({
                    ...prev,
                    vertical: !prev.vertical,
                  }));
                  markDirty();
                }}
                aria-label="Odwróć w pionie"
                color={flip.vertical ? "primary" : "default"}
              >
                <FlipIcon sx={{ transform: "rotate(90deg)" }} />
              </IconButton>
            </span>
          </Tooltip>
          <Button size="small" onClick={resetView} disabled={disabled}>
            Resetuj
          </Button>
          {expanded ? (
            <Button
              size="small"
              onClick={() => setExpanded(false)}
              disabled={disabled}
            >
              Zamknij pełny ekran
            </Button>
          ) : null}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {dirty
            ? "Zmiany kadru zostaną zapisane po kliknięciu Zapisz"
            : "Przeciągnij myszą po zdjęciu, aby zaznaczyć dowolny obszar kadru"}
        </Typography>
        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : null}
      </Stack>
    );

    if (expanded && portalReady) {
      return (
        <>
          <Box sx={{ minHeight: 320 }} aria-hidden />
          {createPortal(
            <Box
              role="dialog"
              aria-modal="true"
              aria-label="Edycja kadru na pełnym ekranie"
              sx={{
                position: "fixed",
                inset: 0,
                zIndex: (theme) => theme.zIndex.modal + 2,
                bgcolor: "background.default",
                p: { xs: 1.5, sm: 2.5 },
                display: "flex",
                flexDirection: "column",
                overflow: "auto",
              }}
            >
              {editor}
            </Box>,
            document.body,
          )}
        </>
      );
    }

    return editor;
  },
);

export default ImageCropEditor;
