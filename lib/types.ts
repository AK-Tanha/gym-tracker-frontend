export type ExerciseType = "single" | "superset" | "giant-set";

export type PlannedExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  type: ExerciseType;
  groupId: string | null;
  groupLabel?: string; // e.g. "SS-1", shown as a small tag in lists
  sets: number;
  reps: number;
  restBetweenSets: number; // seconds
  restBetweenReps: number; // seconds, only relevant inside a group
};

export type WorkoutDay = {
  dayLabel: string;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
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
      lastTime?: string; // e.g. "57.5kg x 8", shown as a reference
    }
  | {
      type: "rest";
      seconds: number;
      reason: "betweenSets" | "betweenReps";
      nextExerciseName: string;
      nextSetLabel: string;
    };
