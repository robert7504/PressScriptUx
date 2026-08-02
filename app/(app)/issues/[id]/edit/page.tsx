import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updateIssueAction } from "@/app/actions/issues";
import Link from "@/components/Link";
import DeleteIssueButton from "@/components/issues/DeleteIssueButton";
import IssueForm from "@/components/issues/IssueForm";
import SectionsTable from "@/components/sections/SectionsTable";
import { ApiError } from "@/lib/api/client";
import { getIssue } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { getMagazine } from "@/lib/magazines/api";
import { listSections } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

type EditIssuePageProps = {
  params: Promise<{ id: string }>;
};

function issueDisplayName(issue: Issue) {
  if (issue.label) return issue.label;
  if (issue.title) return issue.title;
  return `Nr ${issue.issueNumber}/${issue.year}`;
}

export default async function EditIssuePage({ params }: EditIssuePageProps) {
  const { id } = await params;

  let issue: Issue;
  try {
    issue = await getIssue(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać wydania."}
      </Alert>
    );
  }

  let magazineName: string | null = null;
  try {
    const magazine = await getMagazine(issue.magazineId);
    magazineName = magazine.name;
  } catch {
    magazineName = null;
  }

  let sections: Section[] = [];
  let sectionsError: string | null = null;
  try {
    sections = await listSections({ issueId: issue.id });
  } catch (err) {
    sectionsError =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać grzbietów.";
  }

  const boundUpdate = updateIssueAction.bind(null, issue.id);
  const displayName = issueDisplayName(issue);

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
            Edycja wydania
          </Typography>
          <Typography color="text.secondary">{displayName}</Typography>
        </Box>
        <DeleteIssueButton id={issue.id} label={displayName} />
      </Box>
      <IssueForm
        action={boundUpdate}
        issue={issue}
        magazines={[]}
        magazineName={magazineName}
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
              Grzbiety
            </Typography>
            <Typography color="text.secondary">
              Grzbiety należące do tego wydania.
            </Typography>
          </Box>
          <Button
            component={Link}
            href={`/sections/new?issueId=${issue.id}`}
            variant="outlined"
            startIcon={<AddIcon />}
          >
            Dodaj grzbiet
          </Button>
        </Box>

        {sectionsError ? (
          <Alert severity="error">{sectionsError}</Alert>
        ) : null}
        {!sectionsError ? (
          <SectionsTable
            sections={sections}
            issueLabels={{ [issue.id]: displayName }}
            emptyMessage="Brak grzbietów dla tego wydania. Dodaj pierwszy grzbiet."
            deleteRedirectTo={`/issues/${issue.id}/edit`}
          />
        ) : null}
      </Box>
    </>
  );
}
