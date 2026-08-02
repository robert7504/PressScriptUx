export type Publisher = {
  id: string;
  name: string;
  shortName: string | null;
  taxId: string | null;
  regon: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublisherCreateInput = {
  name: string;
  shortName?: string | null;
  taxId?: string | null;
  regon?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type PublisherUpdateInput = PublisherCreateInput & {
  active?: boolean;
};

export type PublisherFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: {
    name?: string;
    email?: string;
  };
};
