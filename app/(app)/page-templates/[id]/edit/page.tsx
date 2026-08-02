import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updatePageTemplateAction } from "@/app/actions/page-templates";
import DeletePageTemplateButton from "@/components/page-templates/DeletePageTemplateButton";
import PageTemplateForm from "@/components/page-templates/PageTemplateForm";
import { ApiError } from "@/lib/api/client";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";
import { getPageTemplate } from "@/lib/page-templates/api";
import type { PageTemplate } from "@/lib/page-templates/types";

type EditPageTemplatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPageTemplatePage({
  params,
}: EditPageTemplatePageProps) {
  const { id } = await params;

  let template: PageTemplate;
  try {
    template = await getPageTemplate(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać wzorca strony."}
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
    template.configurationId &&
    !configurations.some((item) => item.id === template.configurationId)
  ) {
    configurations = [
      {
        id: template.configurationId,
        name: `Konfiguracja ${template.configurationId.slice(0, 8)}…`,
      },
      ...configurations,
    ];
  }

  const boundUpdate = updatePageTemplateAction.bind(null, template.id);

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
            Edycja wzorca strony
          </Typography>
          <Typography color="text.secondary">{template.name}</Typography>
        </Box>
        <DeletePageTemplateButton
          id={template.id}
          name={template.name}
          configurationId={template.configurationId}
        />
      </Box>
      <PageTemplateForm
        action={boundUpdate}
        template={template}
        configurations={configurations}
        submitLabel="Zapisz zmiany"
      />
    </>
  );
}
