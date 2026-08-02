import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createPageTemplateAction } from "@/app/actions/page-templates";
import PageTemplateForm from "@/components/page-templates/PageTemplateForm";
import { ApiError } from "@/lib/api/client";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";

type NewPageTemplatePageProps = {
  searchParams: Promise<{ configurationId?: string }>;
};

export default async function NewPageTemplatePage({
  searchParams,
}: NewPageTemplatePageProps) {
  const { configurationId: defaultConfigurationId } = await searchParams;

  let configurations: { id: string; name: string }[] = [];
  let error: string | null = null;

  try {
    const list = await listMagazineConfigurations({ active: true });
    configurations = list.map((configuration) => ({
      id: configuration.id,
      name: configuration.name,
    }));
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy konfiguracji.";
  }

  const selectedExists = defaultConfigurationId
    ? configurations.some((item) => item.id === defaultConfigurationId)
    : false;

  const cancelHref =
    selectedExists && defaultConfigurationId
      ? `/configurations/${defaultConfigurationId}/edit`
      : "/page-templates";

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowy wzorzec strony
        </Typography>
        <Typography color="text.secondary">
          Utwórz wzorzec i dołącz go do jednej konfiguracji magazynu.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && configurations.length === 0 ? (
        <Alert severity="warning">
          Najpierw dodaj konfigurację — wzorzec wymaga dołączenia do jednej
          konfiguracji.
        </Alert>
      ) : null}
      {!error &&
      defaultConfigurationId &&
      !selectedExists &&
      configurations.length > 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Wybrana konfiguracja jest niedostępna. Wybierz inną z listy.
        </Alert>
      ) : null}
      {!error && configurations.length > 0 ? (
        <PageTemplateForm
          action={createPageTemplateAction}
          configurations={configurations}
          defaultConfigurationId={
            selectedExists ? defaultConfigurationId : undefined
          }
          cancelHref={cancelHref}
          submitLabel="Dodaj wzorzec"
        />
      ) : null}
    </>
  );
}
