import { apiRequest } from "./api";
import type {
  ErpAccessSummary,
  AuthResponse,
  AuthUser,
  LoginInput,
  UpdateCurrentUserInput,
} from "../types/auth";

export function loginErp(input: LoginInput) {
  return apiRequest<AuthResponse>("/erp/auth/login", {
    method: "POST",
    body: input,
  });
}

export function refreshErpSession() {
  return apiRequest<AuthResponse>("/erp/auth/refresh", {
    method: "POST",
  });
}

export function logoutErp() {
  return apiRequest<{ message: string }>("/erp/auth/logout", {
    method: "POST",
  });
}

export function getErpAccessSummary(accessToken: string) {
  return apiRequest<ErpAccessSummary>("/erp/access/me", {
    method: "GET",
    accessToken,
  });
}

export function getCurrentUser(accessToken: string) {
  return apiRequest<AuthUser>("/users/me", {
    method: "GET",
    accessToken,
  });
}

export function updateCurrentUser(
  accessToken: string,
  input: UpdateCurrentUserInput,
) {
  return apiRequest<AuthUser>("/users/me", {
    method: "PATCH",
    accessToken,
    body: normalizeProfilePayload(input),
  });
}

function normalizeProfilePayload(
  input: UpdateCurrentUserInput,
): UpdateCurrentUserInput {
  return {
    firstName: normalizeOptionalText(input.firstName),
    lastName: normalizeOptionalText(input.lastName),
    phone: normalizeOptionalText(input.phone),
    documentType: input.documentType || "",
    documentNumber: normalizeOptionalText(input.documentNumber),
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : "";
}
