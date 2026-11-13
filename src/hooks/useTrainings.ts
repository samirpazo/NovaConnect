import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  trainingService,
  extractApiError,
} from "@/services/trainingService";
import { TrainingAttendance, TrainingInvitation } from "@/types/training";

interface UseTrainingsOptions {
  includeAttendance?: boolean;
}

export function useTrainings(options?: UseTrainingsOptions) {
  const includeAttendance = options?.includeAttendance ?? true;

  const [invitations, setInvitations] = useState<TrainingInvitation[]>([]);
  const [attendances, setAttendances] = useState<TrainingAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainings = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [invitationList, attendanceList] = await Promise.all([
          trainingService.getInvitations(),
          includeAttendance
            ? trainingService.getPendingAttendances()
            : Promise.resolve([] as TrainingAttendance[]),
        ]);
        setInvitations(invitationList);
        setAttendances(attendanceList);
      } catch (err) {
        setError(
          extractApiError(err, "No se pudieron cargar las capacitaciones.")
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [includeAttendance]
  );

  useFocusEffect(
    useCallback(() => {
      fetchTrainings();
    }, [fetchTrainings])
  );

  return {
    invitations,
    attendances,
    isLoading,
    isRefreshing,
    error,
    refetch: () => fetchTrainings(true),
  };
}
