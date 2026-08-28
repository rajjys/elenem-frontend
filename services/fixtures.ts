import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface GenerateFixturesDto {
  seasonId: string;
  legs?: number;
  startDate: string;
  intervalDays?: number;
  daysOfWeek?: number[];
  kickOffTime?: string;
  dryRun?: boolean;
}

export interface GeneratedFixture {
  matchday: number;
  dateTime: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  error?: string;
  gameId?: string;
}

export interface GenerateFixturesResponse {
  dryRun: boolean;
  teamCount: number;
  matchdayCount: number;
  fixtureCount: number;
  createdCount: number;
  skippedCount: number;
  fixtures: GeneratedFixture[];
}

export async function generateFixtures(dto: GenerateFixturesDto): Promise<GenerateFixturesResponse> {
  const res = await api.post('/games/generate-fixtures', dto);
  return res.data as GenerateFixturesResponse;
}

/**
 * Preview and creation are the same endpoint with a `dryRun` flag, but they are different
 * mutations from the UI's point of view: the preview must never touch the games cache, and only
 * the real run should invalidate it.
 */
export function usePreviewFixtures() {
  return useMutation({
    mutationFn: (dto: Omit<GenerateFixturesDto, 'dryRun'>) =>
      generateFixtures({ ...dto, dryRun: true }),
  });
}

export function useCreateFixtures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<GenerateFixturesDto, 'dryRun'>) =>
      generateFixtures({ ...dto, dryRun: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['seasons'] });
    },
  });
}
