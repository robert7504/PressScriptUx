export type AdvertisementIssuePlan = {
  id: string;
  advertisementId: string;
  issueId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdvertisementIssuePlanCreateInput = {
  advertisementId: string;
  issueId: string;
};

export type AdvertisementIssuePlanActionState = {
  error?: string;
  success?: boolean;
};
