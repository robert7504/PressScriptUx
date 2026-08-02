export const ADVERTISEMENT_STATUSES = [
  "DRAFT",
  "READY",
  "BOOKED",
  "CANCELLED",
] as const;

export type AdvertisementStatus = (typeof ADVERTISEMENT_STATUSES)[number];

export const ADVERTISEMENT_STATUS_LABELS: Record<AdvertisementStatus, string> =
  {
    DRAFT: "Szkic",
    READY: "Gotowa",
    BOOKED: "Zarezerwowana",
    CANCELLED: "Anulowana",
  };

export type Advertisement = {
  id: string;
  magazineId: string;
  title: string;
  advertiser: string | null;
  notes: string | null;
  status: AdvertisementStatus;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  previewContentType: string | null;
  previewSizeBytes: number | null;
  contentUrl: string;
  previewUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdvertisementPatchInput = {
  title?: string;
  advertiser?: string | null;
  notes?: string | null;
  status?: AdvertisementStatus;
  active?: boolean;
};

export type AdvertisementUploadOptions = {
  title: string;
  advertiser?: string;
  notes?: string;
  status?: AdvertisementStatus;
};

export type AdvertisementActionState = {
  error?: string;
  success?: boolean;
};

export function advertisementPreviewPath(id: string) {
  return `/api/advertisements/${id}/preview`;
}

export function advertisementContentPath(id: string) {
  return `/api/advertisements/${id}/content`;
}

export function advertisementPreviewSrc(ad: Advertisement) {
  const version = `${ad.previewSizeBytes ?? 0}-${ad.sizeBytes}-${encodeURIComponent(ad.originalFileName)}`;
  return `${advertisementPreviewPath(ad.id)}?v=${version}`;
}
