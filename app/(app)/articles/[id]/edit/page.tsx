import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { updateArticleAction } from "@/app/actions/articles";
import ArticleForm from "@/components/articles/ArticleForm";
import ArticleImagesPanel from "@/components/articles/ArticleImagesPanel";
import Link from "@/components/Link";
import { ApiError } from "@/lib/api/client";
import { getArticle, listArticleImages } from "@/lib/articles/api";
import type { Article, ArticleImage } from "@/lib/articles/types";
import { listIssues } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { listMagazineImages } from "@/lib/magazine-images/api";
import { listMagazines } from "@/lib/magazines/api";
import type { Magazine } from "@/lib/magazines/types";
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

  let magazines: Magazine[] = [];
  let issues: Issue[] = [];
  let sections: Section[] = [];
  let images: ArticleImage[] = [];
  let poolImages: ArticleImage[] = [];
  let imagesError: string | null = null;
  let poolError: string | null = null;
  try {
    [magazines, issues, sections] = await Promise.all([
      listMagazines({ active: true }),
      listIssues({ active: true }),
      listSections({ active: true }),
    ]);
  } catch {
    magazines = [];
    issues = [];
    sections = [];
  }

  try {
    images = await listArticleImages(article.id);
  } catch (error) {
    imagesError =
      error instanceof ApiError
        ? error.message
        : "Nie udało się pobrać zdjęć artykułu.";
  }

  try {
    poolImages = await listMagazineImages(article.magazineId, {
      unassignedOnly: true,
    });
  } catch (error) {
    poolError =
      error instanceof ApiError
        ? error.message
        : "Nie udało się pobrać puli zdjęć magazynu.";
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
        magazines={magazines}
        issues={issues}
        sections={sections}
        submitLabel="Zapisz zmiany"
        cancelHref={returnTo ?? "/articles"}
        cancelLabel={returnTo ? backLabel : "Anuluj"}
        returnTo={returnTo ?? undefined}
      />
      {imagesError ? (
        <Alert severity="warning" sx={{ mt: 3, maxWidth: 880 }}>
          {imagesError}
        </Alert>
      ) : (
        <ArticleImagesPanel
          articleId={article.id}
          magazineId={article.magazineId}
          images={images}
          poolImages={poolImages}
          poolError={poolError}
        />
      )}
    </>
  );
}
