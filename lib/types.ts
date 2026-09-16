export type ExerciseType = "single" | "superset" | "giant-set";

export type ExerciseUnit = "reps" | "time";

export type PlannedExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  type: ExerciseType;
  groupId: string | null;
  groupLabel?: string;
  unit: ExerciseUnit;
  sets: number;
  reps: number;
  duration: number;
  weight: number;
  isFreeWeight?: boolean;
  restBetweenSets: number;
  restBetweenReps: number;
  notes?: string;
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
      unit: ExerciseUnit;
      setNumber: number;
      totalSets: number;
      groupLabel?: string;
      weight?: number;
      reps?: number;
      duration?: number;
      lastTime?: string; // e.g. "57.5kg x 8", shown as a reference
    }
  | {
      type: "rest";
      seconds: number;
      reason: "betweenSets" | "betweenReps";
      nextExerciseName: string;
      nextSetLabel: string;
    };
