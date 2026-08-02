import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MagazineImagesPanel from "@/components/images/MagazineImagesPanel";
import { ApiError } from "@/lib/api/client";
import type { ArticleImage } from "@/lib/articles/types";
import { listMagazineImages } from "@/lib/magazine-images/api";
import { listMagazines } from "@/lib/magazines/api";
import type { Magazine } from "@/lib/magazines/types";

type ImagesPageProps = {
  searchParams: Promise<{
    magazineId?: string;
    unassignedOnly?: string;
  }>;
};

export default async function ImagesPage({ searchParams }: ImagesPageProps) {
  const { magazineId: magazineIdParam, unassignedOnly: unassignedOnlyParam } =
    await searchParams;
  const unassignedOnly = unassignedOnlyParam !== "false";

  let magazines: Magazine[] = [];
  let magazinesError: string | null = null;

  try {
    magazines = await listMagazines({ active: true });
  } catch (error) {
    magazinesError =
      error instanceof ApiError
        ? error.message
        : "Nie udało się pobrać listy magazynów.";
  }

  const magazineId =
    magazines.find((magazine) => magazine.id === magazineIdParam)?.id ??
    magazines[0]?.id ??
    "";

  let images: ArticleImage[] = [];
  let imagesError: string | null = null;

  if (magazineId) {
    try {
      images = await listMagazineImages(magazineId, { unassignedOnly });
    } catch (error) {
      imagesError =
        error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać zdjęć magazynu.";
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Zdjęcia
        </Typography>
        <Typography color="text.secondary">
          Zarządzaj pulą zdjęć magazynu — dodawaj, edytuj metadane i później
          podłączaj je do artykułów.
        </Typography>
      </Box>

      {magazinesError ? (
        <Alert severity="error">{magazinesError}</Alert>
      ) : (
        <MagazineImagesPanel
          magazines={magazines}
          initialMagazineId={magazineId}
          initialImages={images}
          initialUnassignedOnly={unassignedOnly}
          loadError={imagesError}
        />
      )}
    </>
  );
}
