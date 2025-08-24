// The frontend representation of the PublicBusinessProfileResponseDto
export interface PublicBusinessProfileResponseDto {
  id: string;
  name: string;
  description?: string | null;
  bannerImageUrl?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  region?: string | null;
}

// The paginated response structure
export interface PaginatedResponseDto<T> {
  data: T[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}