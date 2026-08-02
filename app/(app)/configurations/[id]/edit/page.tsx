import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updateMagazineConfigurationAction } from "@/app/actions/magazine-configurations";
import Link from "@/components/Link";
import DeleteMagazineConfigurationButton from "@/components/magazine-configurations/DeleteMagazineConfigurationButton";
import MagazineConfigurationForm from "@/components/magazine-configurations/MagazineConfigurationForm";
import PageTemplatesTable from "@/components/page-templates/PageTemplatesTable";
import ParagraphStylesTable from "@/components/paragraph-styles/ParagraphStylesTable";
import { ApiError } from "@/lib/api/client";
import { getMagazineConfiguration } from "@/lib/magazine-configurations/api";
import type { MagazineConfiguration } from "@/lib/magazine-configurations/types";
import { listMagazines } from "@/lib/magazines/api";
import { listPageTemplates } from "@/lib/page-templates/api";
import type { PageTemplate } from "@/lib/page-templates/types";
import { listParagraphStyles } from "@/lib/paragraph-styles/api";
import type { ParagraphStyle } from "@/lib/paragraph-styles/types";

type EditConfigurationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditConfigurationPage({
  params,
}: EditConfigurationPageProps) {
  const { id } = await params;

  let configuration: MagazineConfiguration;
  try {
    configuration = await getMagazineConfiguration(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać konfiguracji."}
      </Alert>
    );
  }

  let magazines: { id: string; name: string }[] = [];
  try {
    const list = await listMagazines();
    magazines = list.map((magazine) => ({
      id: magazine.id,
      name: magazine.name,
    }));
  } catch {
    magazines = [];
  }

  let styles: ParagraphStyle[] = [];
  let stylesError: string | null = null;
  try {
    styles = await listParagraphStyles({ configurationId: configuration.id });
  } catch (err) {
    stylesError =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać stylów akapitowych.";
  }

  let templates: PageTemplate[] = [];
  let templatesError: string | null = null;
  try {
    templates = await listPageTemplates({ configurationId: configuration.id });
  } catch (err) {
    templatesError =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać wzorców stron.";
  }

  const boundUpdate = updateMagazineConfigurationAction.bind(
    null,
    configuration.id,
  );

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
            Edycja konfiguracji
          </Typography>
          <Typography color="text.secondary">{configuration.name}</Typography>
        </Box>
        <DeleteMagazineConfigurationButton
          id={configuration.id}
          name={configuration.name}
        />
      </Box>
      <MagazineConfigurationForm
        action={boundUpdate}
        configuration={configuration}
        magazines={magazines}
        submitLabel="Zapisz zmiany"
      />

      <Box sx={{ mt: 5 }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Wzorce stron
            </Typography>
            <Typography color="text.secondary">
              {configuration.type === "LAYOUT"
                ? "Konfiguracja Layout — wzorce stron używane przy przepisywaniu stron do grzbietu."
                : "Wzorce stron dołączone do tej konfiguracji."}
            </Typography>
          </Box>
          <Button
            component={Link}
            href={`/page-templates/new?configurationId=${configuration.id}`}
            variant="outlined"
            startIcon={<AddIcon />}
          >
            Dodaj wzorzec
          </Button>
        </Box>

        {templatesError ? (
          <Alert severity="error">{templatesError}</Alert>
        ) : null}
        {!templatesError ? (
          <PageTemplatesTable
            templates={templates}
            configurationNames={{ [configuration.id]: configuration.name }}
            emptyMessage="Brak wzorców dla tej konfiguracji. Dodaj pierwszy wzorzec."
            deleteRedirectTo={`/configurations/${configuration.id}/edit`}
          />
        ) : null}
      </Box>

      <Box sx={{ mt: 5 }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Style akapitowe
            </Typography>
            <Typography color="text.secondary">
              Style dołączone do tej konfiguracji.
            </Typography>
          </Box>
          <Button
            component={Link}
            href={`/paragraph-styles/new?configurationId=${configuration.id}`}
            variant="outlined"
            startIcon={<AddIcon />}
          >
            Dodaj styl
          </Button>
        </Box>

        {stylesError ? <Alert severity="error">{stylesError}</Alert> : null}
        {!stylesError ? (
          <ParagraphStylesTable
            styles={styles}
            configurationNames={{ [configuration.id]: configuration.name }}
            emptyMessage="Brak stylów dla tej konfiguracji. Dodaj pierwszy styl."
            deleteRedirectTo={`/configurations/${configuration.id}/edit`}
          />
        ) : null}
      </Box>
    </>
  );
}
