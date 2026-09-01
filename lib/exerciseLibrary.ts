export type LibraryExercise = {
  name: string;
  muscleGroup: string;
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  { name: "Barbell bench press", muscleGroup: "Chest" },
  { name: "Incline barbell bench press", muscleGroup: "Chest" },
  { name: "Decline barbell bench press", muscleGroup: "Chest" },
  { name: "Dumbbell bench press", muscleGroup: "Chest" },
  { name: "Incline dumbbell press", muscleGroup: "Chest" },
  { name: "Dumbbell fly", muscleGroup: "Chest" },
  { name: "Cable fly", muscleGroup: "Chest" },
  { name: "Pec deck", muscleGroup: "Chest" },
  { name: "Push-up", muscleGroup: "Chest" },
  { name: "Dips (chest)", muscleGroup: "Chest" },

  { name: "Deadlift", muscleGroup: "Back" },
  { name: "Conventional deadlift", muscleGroup: "Back" },
  { name: "Sumo deadlift", muscleGroup: "Back" },
  { name: "Romanian deadlift", muscleGroup: "Back" },
  { name: "Pull-up", muscleGroup: "Back" },
  { name: "Chin-up", muscleGroup: "Back" },
  { name: "Lat pulldown", muscleGroup: "Back" },
  { name: "Barbell row", muscleGroup: "Back" },
  { name: "Pendlay row", muscleGroup: "Back" },
  { name: "One-arm dumbbell row", muscleGroup: "Back" },
  { name: "Seated cable row", muscleGroup: "Back" },
  { name: "T-bar row", muscleGroup: "Back" },
  { name: "Face pull", muscleGroup: "Back" },
  { name: "Rear delt fly", muscleGroup: "Back" },
  { name: "Back extension", muscleGroup: "Back" },

  { name: "Overhead press", muscleGroup: "Shoulders" },
  { name: "Seated dumbbell shoulder press", muscleGroup: "Shoulders" },
  { name: "Machine shoulder press", muscleGroup: "Shoulders" },
  { name: "Arnold press", muscleGroup: "Shoulders" },
  { name: "Lateral raise", muscleGroup: "Shoulders" },
  { name: "Cable lateral raise", muscleGroup: "Shoulders" },
  { name: "Front raise", muscleGroup: "Shoulders" },
  { name: "Reverse fly", muscleGroup: "Shoulders" },
  { name: "Barbell upright row", muscleGroup: "Shoulders" },

  { name: "Barbell curl", muscleGroup: "Biceps" },
  { name: "Dumbbell curl", muscleGroup: "Biceps" },
  { name: "Hammer curl", muscleGroup: "Biceps" },
  { name: "Preacher curl", muscleGroup: "Biceps" },
  { name: "Cable curl", muscleGroup: "Biceps" },
  { name: "Concentration curl", muscleGroup: "Biceps" },

  { name: "Close-grip bench press", muscleGroup: "Triceps" },
  { name: "Tricep pushdown", muscleGroup: "Triceps" },
  { name: "Overhead tricep extension", muscleGroup: "Triceps" },
  { name: "Skull crusher", muscleGroup: "Triceps" },
  { name: "Dips (triceps)", muscleGroup: "Triceps" },
  { name: "Bench dip", muscleGroup: "Triceps" },

  { name: "Squat", muscleGroup: "Legs" },
  { name: "Back squat", muscleGroup: "Legs" },
  { name: "Front squat", muscleGroup: "Legs" },
  { name: "Goblet squat", muscleGroup: "Legs" },
  { name: "Leg press", muscleGroup: "Legs" },
  { name: "Hack squat", muscleGroup: "Legs" },
  { name: "Bulgarian split squat", muscleGroup: "Legs" },
  { name: "Walking lunge", muscleGroup: "Legs" },
  { name: "Leg extension", muscleGroup: "Legs" },
  { name: "Leg curl", muscleGroup: "Legs" },
  { name: "Romanian deadlift (legs)", muscleGroup: "Legs" },
  { name: "Calf raise", muscleGroup: "Legs" },
  { name: "Seated calf raise", muscleGroup: "Legs" },
  { name: "Sumo squat", muscleGroup: "Legs" },

  { name: "Hip thrust", muscleGroup: "Glutes" },
  { name: "Glute bridge", muscleGroup: "Glutes" },
  { name: "Cable kickback", muscleGroup: "Glutes" },

  { name: "Plank", muscleGroup: "Abs" },
  { name: "Side plank", muscleGroup: "Abs" },
  { name: "Crunch", muscleGroup: "Abs" },
  { name: "Leg raise", muscleGroup: "Abs" },
  { name: "Hanging leg raise", muscleGroup: "Abs" },
  { name: "Cable crunch", muscleGroup: "Abs" },
  { name: "Ab wheel rollout", muscleGroup: "Abs" },
  { name: "Russian twist", muscleGroup: "Abs" },
  { name: "Mountain climber", muscleGroup: "Abs" },

  { name: "Farmer carry", muscleGroup: "Full body" },
  { name: "Burpee", muscleGroup: "Full body" },
  { name: "Kettlebell swing", muscleGroup: "Full body" },
  { name: "Clean and press", muscleGroup: "Full body" },
  { name: "Snatch", muscleGroup: "Full body" },
  { name: "Thruster", muscleGroup: "Full body" },

  { name: "Cardio machine", muscleGroup: "Cardio" },
  { name: "Treadmill run", muscleGroup: "Cardio" },
  { name: "Rowing machine", muscleGroup: "Cardio" },
  { name: "Assault bike", muscleGroup: "Cardio" },
  { name: "Jump rope", muscleGroup: "Cardio" },
  { name: "Stair climber", muscleGroup: "Cardio" },
];

export function suggestionsFor(query: string): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXERCISE_LIBRARY.slice(0, 6);
  return EXERCISE_LIBRARY.filter(
    (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
  ).slice(0, 6);
}
