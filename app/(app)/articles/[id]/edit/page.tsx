import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updateArticleAction } from "@/app/actions/articles";
import ArticleForm from "@/components/articles/ArticleForm";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { getArticle } from "@/lib/articles/api";
import type { Article } from "@/lib/articles/types";
import { safeReturnTo } from "@/lib/navigation/returnTo";
import { listSections } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function EditArticlePage({
  params,
  searchParams,
}: EditArticlePageProps) {
  const { id } = await params;
  const { returnTo: returnToParam } = await searchParams;
  const returnTo = safeReturnTo(returnToParam);

  let article: Article;
  try {
    article = await getArticle(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać artykułu."}
      </Alert>
    );
  }

  let sections: Section[] = [];
  try {
    sections = await listSections({ active: true });
  } catch {
    sections = [];
  }

  const boundUpdate = updateArticleAction.bind(null, article.id);
  const backLabel = returnTo?.includes("/pages/")
    ? "Wróć do podglądu strony"
    : "Wróć";

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edycja artykułu
        </Typography>
        <Typography color="text.secondary">{article.title}</Typography>
        {returnTo ? (
          <Button
            component={Link}
            href={returnTo}
            variant="text"
            size="small"
            sx={{ mt: 1, px: 0 }}
          >
            ← {backLabel}
          </Button>
        ) : null}
      </Box>
      <ArticleForm
        action={boundUpdate}
        article={article}
        sections={sections}
        submitLabel="Zapisz zmiany"
        cancelHref={returnTo ?? "/articles"}
        cancelLabel={returnTo ? backLabel : "Anuluj"}
        returnTo={returnTo ?? undefined}
      />
    </>
  );
}
