// The paginated response structure
export interface PaginatedResponseDto<T> {
  data: T[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}