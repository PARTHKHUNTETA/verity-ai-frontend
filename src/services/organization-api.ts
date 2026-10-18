import type { Member } from "@/types/api";
import { apiRequest } from "./api-client";

export const organizationApi = {
  listMembers: async () =>
    (await apiRequest<{ members: Member[] }>("/organization/members")).members,
};
