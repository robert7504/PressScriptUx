import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updateMagazineAction } from "@/app/actions/magazines";
import DeleteMagazineButton from "@/components/magazines/DeleteMagazineButton";
import MagazineForm from "@/components/magazines/MagazineForm";
import { ApiError } from "@/lib/api/client";
import { getMagazine } from "@/lib/magazines/api";
import type { Magazine } from "@/lib/magazines/types";
import { getPublisher } from "@/lib/publishers/api";

type EditMagazinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMagazinePage({
  params,
}: EditMagazinePageProps) {
  const { id } = await params;

  let magazine: Magazine;
  try {
    magazine = await getMagazine(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać magazynu."}
      </Alert>
    );
  }

  let publisherName: string | null = null;
  try {
    const publisher = await getPublisher(magazine.publisherId);
    publisherName = publisher.name;
  } catch {
    publisherName = null;
  }

  const boundUpdate = updateMagazineAction.bind(null, magazine.id);

  return (
    <>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { sm: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Edycja magazynu
          </Typography>
          <Typography color="text.secondary">{magazine.name}</Typography>
        </Box>
        <DeleteMagazineButton id={magazine.id} name={magazine.name} />
      </Box>
      <MagazineForm
        action={boundUpdate}
        magazine={magazine}
        publishers={[]}
        publisherName={publisherName}
        submitLabel="Zapisz zmiany"
      />
    </>
  );
}
