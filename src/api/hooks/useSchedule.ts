import { useQuery } from '@tanstack/react-query';
import { getWeekSchedule, getTeamWeekSchedule } from '../clients/nhlClient';
import { TeamAbbrev } from '@/models';

/** Query key factory for schedule queries */
export const scheduleKeys = {
  all: ['schedule'] as const,
  week: (startDate: string) => [...scheduleKeys.all, 'week', startDate] as const,
  team: (team: TeamAbbrev, startDate: string) =>
    [...scheduleKeys.all, 'team', team, startDate] as const,
};

/** Hook to fetch the full NHL schedule for a week */
export function useWeekSchedule(startDate: string) {
  return useQuery({
    queryKey: scheduleKeys.week(startDate),
    queryFn: () => getWeekSchedule(startDate),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/** Hook to fetch schedule for a specific team */
export function useTeamSchedule(team: TeamAbbrev, startDate: string) {
  return useQuery({
    queryKey: scheduleKeys.team(team, startDate),
    queryFn: () => getTeamWeekSchedule(team, startDate),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    enabled: !!team,
  });
}

/** Hook to fetch schedules for multiple teams */
export function useTeamSchedules(teams: TeamAbbrev[], startDate: string) {
  return useQuery({
    queryKey: [...scheduleKeys.all, 'teams', teams.sort().join(','), startDate],
    queryFn: async () => {
      // Get the full week schedule which includes all teams
      const weekSchedule = await getWeekSchedule(startDate);

      // Filter to only requested teams
      const filteredByTeam = Object.fromEntries(
        Object.entries(weekSchedule.byTeam).filter(([team]) =>
          teams.includes(team)
        )
      );

      return {
        ...weekSchedule,
        byTeam: filteredByTeam,
      };
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    enabled: teams.length > 0,
  });
}
