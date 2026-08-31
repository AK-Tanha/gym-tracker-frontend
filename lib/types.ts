export type ExerciseType = "single" | "superset" | "giant-set";

export type PlannedExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  type: ExerciseType;
  groupId: string | null;
  groupLabel?: string;
  sets: number;
  reps: number;
  weight: number;
  restBetweenSets: number;
  restBetweenReps: number;
};

export type WorkoutDay = {
  dayLabel: string;
  category?: string;
  dayOfWeek: number;
  isRestDay: boolean;
  exercises: PlannedExercise[];
};

export type Program = {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  isOwn?: boolean;
  isActive?: boolean;
  workoutDays?: WorkoutDay[];
};

// One item in the flattened execution queue for a session.
export type ExecutionStep =
  | {
      type: "exercise";
      exerciseId: string;
      exerciseName: string;
      muscleGroup: string;
      setNumber: number;
      totalSets: number;
      groupLabel?: string;
      weight?: number;
      reps?: number;
      lastTime?: string; // e.g. "57.5kg x 8", shown as a reference
    }
  | {
      type: "rest";
      seconds: number;
      reason: "betweenSets" | "betweenReps";
      nextExerciseName: string;
      nextSetLabel: string;
    };
