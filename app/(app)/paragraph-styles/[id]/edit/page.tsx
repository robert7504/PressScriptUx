import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updateParagraphStyleAction } from "@/app/actions/paragraph-styles";
import DeleteParagraphStyleButton from "@/components/paragraph-styles/DeleteParagraphStyleButton";
import ParagraphStyleForm from "@/components/paragraph-styles/ParagraphStyleForm";
import { ApiError } from "@/lib/api/client";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";
import { getParagraphStyle } from "@/lib/paragraph-styles/api";
import type { ParagraphStyle } from "@/lib/paragraph-styles/types";

type EditParagraphStylePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditParagraphStylePage({
  params,
}: EditParagraphStylePageProps) {
  const { id } = await params;

  let style: ParagraphStyle;
  try {
    style = await getParagraphStyle(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać stylu akapitowego."}
      </Alert>
    );
  }

  let configurations: { id: string; name: string }[] = [];
  try {
    const list = await listMagazineConfigurations();
    configurations = list.map((configuration) => ({
      id: configuration.id,
      name: configuration.name,
    }));
  } catch {
    configurations = [];
  }

  if (
    style.configurationId &&
    !configurations.some((item) => item.id === style.configurationId)
  ) {
    configurations = [
      {
        id: style.configurationId,
        name: `Konfiguracja ${style.configurationId.slice(0, 8)}…`,
      },
      ...configurations,
    ];
  }

  const boundUpdate = updateParagraphStyleAction.bind(null, style.id);

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
            Edycja stylu akapitowego
          </Typography>
          <Typography color="text.secondary">{style.name}</Typography>
        </Box>
        <DeleteParagraphStyleButton
          id={style.id}
          name={style.name}
          configurationId={style.configurationId}
        />
      </Box>
      <ParagraphStyleForm
        action={boundUpdate}
        style={style}
        configurations={configurations}
        submitLabel="Zapisz zmiany"
      />
    </>
  );
}
