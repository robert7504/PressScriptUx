import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";
import PagePreview from "@/components/pages/PagePreview";
import { ApiError } from "@/lib/api/client";
import { listArticlePageBindings } from "@/lib/article-page-bindings/api";
import type { ArticlePageBinding } from "@/lib/article-page-bindings/types";
import { listArticles } from "@/lib/articles/api";
import type { Article } from "@/lib/articles/types";
import { sortPages } from "@/lib/pages/geometry";
import { listPages } from "@/lib/pages/api";
import type { Page } from "@/lib/pages/types";
import { getSection } from "@/lib/sections/api";
import type { Section } from "@/lib/sections/types";

type PagePreviewRouteProps = {
  params: Promise<{ id: string; pageId: string }>;
};

export default async function SectionPagePreviewPage({
  params,
}: PagePreviewRouteProps) {
  const { id, pageId } = await params;

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

  let pages: Page[] = [];
  try {
    pages = sortPages(await listPages({ sectionId: section.id }));
  } catch (error) {
    return (
      <Alert severity="error">
        {error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać stron grzbietu."}
      </Alert>
    );
  }

  const currentPage = pages.find((page) => page.id === pageId);
  if (!currentPage || currentPage.sectionId !== section.id) {
    notFound();
  }

  let articles: Article[] = [];
  try {
    // All active articles — binding is not limited to section membership.
    // Section-linked articles are sorted first in the picker UI.
    articles = await listArticles({ active: true });
  } catch {
    articles = [];
  }

  let bindings: ArticlePageBinding[] = [];
  try {
    bindings = await listArticlePageBindings({
      pageId: currentPage.id,
      active: true,
    });
  } catch {
    bindings = [];
  }

  return (
    <PagePreview
      section={{ id: section.id, name: section.name }}
      pages={pages}
      currentPage={currentPage}
      articles={articles}
      bindings={bindings}
    />
  );
}
