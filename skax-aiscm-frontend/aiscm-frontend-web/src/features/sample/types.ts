export interface SampleItem {
  id: number;
  name: string;
  description: string | null;
  createdDate: string;
  lastModifiedDate: string;
}

export interface SampleItemRequest {
  name: string;
  description?: string;
}

/** common UserResponse JSON (Feign 합성 조회) */
export interface CommonUserSummary {
  id: number;
  userId: string;
  email: string;
  username: string;
  status: string;
}

