import { WorkoutDay, Program } from "./types";

// Placeholder data standing in for GET /workouts/today until the
// Express API is wired up. Shape matches the WorkoutDay type exactly
// so swapping in a real fetch later is a drop-in replacement.
export const todaysWorkout: WorkoutDay = {
  dayLabel: "Chest + Triceps",
  dayOfWeek: 0,
  isRestDay: false,
  exercises: [
    {
      id: "ex1",
      name: "Barbell bench press",
      muscleGroup: "Chest",
      type: "single",
      groupId: null,
      sets: 4,
      reps: 8,
      restBetweenSets: 90,
      restBetweenReps: 0,
    },
    {
      id: "ex2",
      name: "Incline dumbbell press",
      muscleGroup: "Chest",
      type: "superset",
      groupId: "ss-1",
      groupLabel: "SS-1",
      sets: 3,
      reps: 10,
      restBetweenSets: 90,
      restBetweenReps: 20,
    },
    {
      id: "ex3",
      name: "Cable fly",
      muscleGroup: "Chest",
      type: "superset",
      groupId: "ss-1",
      groupLabel: "SS-1",
      sets: 3,
      reps: 12,
      restBetweenSets: 90,
      restBetweenReps: 20,
    },
    {
      id: "ex4",
      name: "Tricep pushdown",
      muscleGroup: "Triceps",
      type: "single",
      groupId: null,
      sets: 3,
      reps: 12,
      restBetweenSets: 60,
      restBetweenReps: 0,
    },
    {
      id: "ex5",
      name: "Overhead extension",
      muscleGroup: "Triceps",
      type: "single",
      groupId: null,
      sets: 3,
      reps: 12,
      restBetweenSets: 60,
      restBetweenReps: 0,
    },
  ],
};

export const weekStrip = [
  { label: "M", isWorkout: true },
  { label: "T", isWorkout: false },
  { label: "W", isWorkout: true },
  { label: "T", isWorkout: false },
  { label: "F", isWorkout: true },
  { label: "S", isWorkout: false },
  { label: "S", isWorkout: true }, // today
];

export const programs: Program[] = [
  {
    id: "p1",
    name: "3-Day Split",
    description:
      "Full body split across 3 weekly sessions. Good starting point for beginners.",
    daysPerWeek: 3,
  },
  {
    id: "p2",
    name: "Push Pull Legs",
    description: "Classic 6-day PPL rotation for intermediate to advanced lifters.",
    daysPerWeek: 6,
  },
  {
    id: "p3",
    name: "Superset Builder",
    description:
      "Paired exercises back-to-back. Built for shorter, high-intensity sessions.",
    daysPerWeek: 4,
  },
];

export const myWorkouts: Program[] = [
  {
    id: "mw1",
    name: "My Push Pull Legs",
    description: "Customized from Push Pull Legs — swapped OHP for machine shoulder press.",
    daysPerWeek: 6,
    isOwn: true,
    isActive: true,
  },
];

export const progressStats = {
  workoutsDone: 14,
  streakDays: 5,
  totalVolumeTonnes: 38.2,
  newPRs: 3,
  weekStreak: [true, false, true, true, true, false, true],
  benchProgression: [55, 62, 68, 80], // relative bar heights, %
  recentPRs: [
    { name: "Barbell bench press", when: "2 days ago", value: "62.5kg x 8" },
    { name: "Deadlift", when: "6 days ago", value: "120kg x 5" },
    { name: "Overhead press", when: "9 days ago", value: "42.5kg x 6" },
  ],
};
