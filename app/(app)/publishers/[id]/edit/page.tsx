import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updatePublisherAction } from "@/app/actions/publishers";
import DeletePublisherButton from "@/components/publishers/DeletePublisherButton";
import PublisherForm from "@/components/publishers/PublisherForm";
import { ApiError } from "@/lib/api/client";
import { getPublisher } from "@/lib/publishers/api";
import type { Publisher } from "@/lib/publishers/types";

type EditPublisherPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPublisherPage({
  params,
}: EditPublisherPageProps) {
  const { id } = await params;

  let publisher: Publisher;
  try {
    publisher = await getPublisher(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać wydawcy."}
      </Alert>
    );
  }

  const boundUpdate = updatePublisherAction.bind(null, publisher.id);

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
            Edycja wydawcy
          </Typography>
          <Typography color="text.secondary">{publisher.name}</Typography>
        </Box>
        <DeletePublisherButton id={publisher.id} name={publisher.name} />
      </Box>
      <PublisherForm
        action={boundUpdate}
        publisher={publisher}
        submitLabel="Zapisz zmiany"
      />
    </>
  );
}
