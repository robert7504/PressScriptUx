export type UserRole = "ADMIN" | "USER";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type LoginFormState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};
