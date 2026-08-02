import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import {
  createPagesFromTemplateAction,
} from "@/app/actions/pages";
import { updateSectionAction } from "@/app/actions/sections";
import PagesFromTemplateForm from "@/components/pages/PagesFromTemplateForm";
import PagesTable from "@/components/pages/PagesTable";
import DeleteSectionButton from "@/components/sections/DeleteSectionButton";
import SectionForm from "@/components/sections/SectionForm";
import { ApiError } from "@/lib/api/client";
import { getIssue } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { listMagazineConfigurations } from "@/lib/magazine-configurations/api";
import type { MagazineConfiguration } from "@/lib/magazine-configurations/types";
import { listPageTemplates } from "@/lib/page-templates/api";
import type { PageTemplate } from "@/lib/page-templates/types";
import { listPages } from "@/lib/pages/api";
import type { Page } from "@/lib/pages/types";
import { getSection } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

type EditSectionPageProps = {
  params: Promise<{ id: string }>;
};

function issueLabel(issue: Issue) {
  if (issue.label) return issue.label;
  if (issue.title) return issue.title;
  return `Nr ${issue.issueNumber}/${issue.year}`;
}

function extractSectionCodes(configuration: MagazineConfiguration) {
  const sections = configuration.payload?.sections;
  if (!Array.isArray(sections)) return [] as string[];

  const codes = new Set<string>();
  for (const item of sections) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const code =
      typeof record.sectionCode === "string" ? record.sectionCode.trim() : "";
    const name =
      typeof record.sectionName === "string" ? record.sectionName.trim() : "";
    if (code) codes.add(code);
    else if (name) codes.add(name);
  }
  return Array.from(codes);
}

export default async function EditSectionPage({
  params,
}: EditSectionPageProps) {
  const { id } = await params;

  let section: Section;
  try {
    section = await getSection(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać grzbietu."}
      </Alert>
    );
  }

  let issue: Issue | null = null;
  let issueName: string | null = null;
  try {
    issue = await getIssue(section.issueId);
    issueName = issueLabel(issue);
  } catch {
    issue = null;
    issueName = null;
  }

  let pages: Page[] = [];
  let pagesError: string | null = null;
  try {
    pages = await listPages({ sectionId: section.id });
  } catch (error) {
    pagesError =
      error instanceof ApiError
        ? error.message
        : "Nie udało się pobrać stron grzbietu.";
  }

  let layoutConfigurations: MagazineConfiguration[] = [];
  let templates: PageTemplate[] = [];
  let layoutError: string | null = null;
  if (issue) {
    try {
      layoutConfigurations = await listMagazineConfigurations({
        type: "LAYOUT",
        magazineId: issue.magazineId,
        active: true,
      });
      const templateLists = await Promise.all(
        layoutConfigurations.map((configuration) =>
          listPageTemplates({
            configurationId: configuration.id,
            active: true,
          }).catch(() => [] as PageTemplate[]),
        ),
      );
      templates = templateLists.flat();
    } catch (error) {
      layoutError =
        error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać konfiguracji Layout.";
    }
  }

  const boundUpdate = updateSectionAction.bind(null, section.id);
  const boundCreatePages = createPagesFromTemplateAction.bind(
    null,
    section.id,
    section.issueId,
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
            Edycja grzbietu
          </Typography>
          <Typography color="text.secondary">{section.name}</Typography>
        </Box>
        <DeleteSectionButton
          id={section.id}
          name={section.name}
          issueId={section.issueId}
        />
      </Box>
      <SectionForm
        action={boundUpdate}
        section={section}
        issues={[]}
        issueLabel={issueName}
        submitLabel="Zapisz zmiany"
      />

      <Box sx={{ mt: 5 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Przepisanie stron z konfiguracji
          </Typography>
          <Typography color="text.secondary">
            Zaznacz wzorce stron z konfiguracji Layout i przepisz je do
            grzbietu naraz — albo wszystkie, albo wybrane.
          </Typography>
        </Box>

        {layoutError ? <Alert severity="error">{layoutError}</Alert> : null}
        {!issue ? (
          <Alert severity="warning">
            Nie udało się pobrać wydania grzbietu — nie można wczytać
            konfiguracji Layout.
          </Alert>
        ) : null}
        {!layoutError && issue ? (
          <PagesFromTemplateForm
            action={boundCreatePages}
            configurations={layoutConfigurations.map((configuration) => ({
              id: configuration.id,
              name: configuration.name,
              sectionCodes: extractSectionCodes(configuration),
            }))}
            templates={templates.map((template) => ({
              id: template.id,
              name: template.name,
              slug: template.slug,
              configurationId: template.configurationId,
              width: template.width,
              height: template.height,
              unit: template.unit,
            }))}
            defaultSectionCode={section.code ?? section.name}
            defaultStartPage={section.startPage}
          />
        ) : null}
      </Box>

      <Box sx={{ mt: 5 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Strony grzbietu
          </Typography>
          <Typography color="text.secondary">
            Strony należące do tego grzbietu.
          </Typography>
        </Box>

        {pagesError ? <Alert severity="error">{pagesError}</Alert> : null}
        {!pagesError ? (
          <PagesTable
            pages={pages}
            sectionId={section.id}
            issueId={section.issueId}
          />
        ) : null}
      </Box>
    </>
  );
}
