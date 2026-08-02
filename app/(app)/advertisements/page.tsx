import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MagazineAdvertisementsPanel from "@/components/advertisements/MagazineAdvertisementsPanel";
import { listAdvertisementIssuePlans } from "@/lib/advertisement-issue-plans/api";
import type { AdvertisementIssuePlan } from "@/lib/advertisement-issue-plans/types";
import { listMagazineAdvertisements } from "@/lib/advertisements/api";
import type { Advertisement } from "@/lib/advertisements/types";
import { ApiError } from "@/lib/api/client";
import { listIssues } from "@/lib/issues/api";
import type { Issue } from "@/lib/issues/types";
import { listMagazines } from "@/lib/magazines/api";
import type { Magazine } from "@/lib/magazines/types";

type AdvertisementsPageProps = {
  searchParams: Promise<{
    magazineId?: string;
  }>;
};

export default async function AdvertisementsPage({
  searchParams,
}: AdvertisementsPageProps) {
  const { magazineId: magazineIdParam } = await searchParams;

  let magazines: Magazine[] = [];
  let magazinesError: string | null = null;

  try {
    magazines = await listMagazines({ active: true });
  } catch (error) {
    magazinesError =
      error instanceof ApiError
        ? error.message
        : "Nie udało się pobrać listy magazynów.";
  }

  const magazineId =
    magazines.find((magazine) => magazine.id === magazineIdParam)?.id ??
    magazines[0]?.id ??
    "";

  let advertisements: Advertisement[] = [];
  let advertisementsError: string | null = null;
  let issues: Issue[] = [];
  let plans: AdvertisementIssuePlan[] = [];

  if (magazineId) {
    try {
      advertisements = await listMagazineAdvertisements(magazineId, {
        active: true,
      });
    } catch (error) {
      advertisementsError =
        error instanceof ApiError
          ? error.message
          : "Nie udało się pobrać reklam magazynu.";
    }

    try {
      issues = await listIssues({ active: true, magazineId });
    } catch {
      issues = [];
    }

    const advertisementIds = new Set(advertisements.map((ad) => ad.id));
    try {
      const allPlans = await listAdvertisementIssuePlans({ active: true });
      plans = allPlans.filter((plan) =>
        advertisementIds.has(plan.advertisementId),
      );
    } catch {
      plans = [];
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reklamy
        </Typography>
        <Typography color="text.secondary">
          Przesyłaj pliki reklam (PDF/EPS), zarządzaj metadanymi i planuj ich
          pojawienie się w wybranych wydaniach.
        </Typography>
      </Box>

      {magazinesError ? (
        <Alert severity="error">{magazinesError}</Alert>
      ) : (
        <MagazineAdvertisementsPanel
          magazines={magazines}
          issues={issues}
          plans={plans}
          initialMagazineId={magazineId}
          initialAdvertisements={advertisements}
          loadError={advertisementsError}
        />
      )}
    </>
  );
}
