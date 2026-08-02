import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createSectionAction } from "@/app/actions/sections";
import SectionForm from "@/components/sections/SectionForm";
import { ApiError } from "@/lib/api/client";
import { listIssues } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";

type NewSectionPageProps = {
  searchParams: Promise<{ issueId?: string }>;
};

function issueLabel(issue: Issue) {
  if (issue.label) return issue.label;
  if (issue.title) return issue.title;
  return `Nr ${issue.issueNumber}/${issue.year}`;
}

export default async function NewSectionPage({
  searchParams,
}: NewSectionPageProps) {
  const { issueId: defaultIssueId } = await searchParams;

  let issues: { id: string; label: string }[] = [];
  let error: string | null = null;

  try {
    const list = await listIssues({ active: true });
    issues = list.map((issue) => ({
      id: issue.id,
      label: issueLabel(issue),
    }));
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : "Nie udało się pobrać listy wydań.";
  }

  const selectedExists = defaultIssueId
    ? issues.some((item) => item.id === defaultIssueId)
    : false;

  const cancelHref =
    selectedExists && defaultIssueId
      ? `/issues/${defaultIssueId}/edit`
      : "/sections";

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nowy grzbiet
        </Typography>
        <Typography color="text.secondary">
          Utwórz grzbiet i dołącz go do jednego wydania.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && issues.length === 0 ? (
        <Alert severity="warning">
          Najpierw dodaj wydanie — grzbiet wymaga dołączenia do jednego
          wydania.
        </Alert>
      ) : null}
      {!error &&
      defaultIssueId &&
      !selectedExists &&
      issues.length > 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Wybrane wydanie jest niedostępne. Wybierz inne z listy.
        </Alert>
      ) : null}
      {!error && issues.length > 0 ? (
        <SectionForm
          action={createSectionAction}
          issues={issues}
          defaultIssueId={selectedExists ? defaultIssueId : undefined}
          cancelHref={cancelHref}
          submitLabel="Dodaj grzbiet"
        />
      ) : null}
    </>
  );
}
