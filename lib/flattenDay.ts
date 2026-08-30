import { PlannedExercise, ExecutionStep } from "./types";

/**
 * Turns a day's exercise list into a linear queue of steps
 * (exercise -> rest -> exercise -> rest ...) so the execution
 * runner UI never has to branch on single/superset/giant-set at
 * render time. Mirrors the backend's flattenDay service.
 */
export function flattenDay(exercises: PlannedExercise[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];

  // Group exercises that share a groupId so we can interleave
  // their sets round by round (superset/giant-set behaviour).
  const groups = new Map<string, PlannedExercise[]>();
  const singles: PlannedExercise[] = [];

  for (const ex of exercises) {
    if (ex.type === "single" || !ex.groupId) {
      singles.push(ex);
    } else {
      const arr = groups.get(ex.groupId) ?? [];
      arr.push(ex);
      groups.set(ex.groupId, arr);
    }
  }

  for (const ex of singles) {
    for (let set = 1; set <= ex.sets; set++) {
      steps.push({
        type: "exercise",
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        setNumber: set,
        totalSets: ex.sets,
      });
      const isLastSet = set === ex.sets;
      if (!isLastSet) {
        steps.push({
          type: "rest",
          seconds: ex.restBetweenSets,
          reason: "betweenSets",
          nextExerciseName: ex.name,
          nextSetLabel: `Set ${set + 1} of ${ex.sets}`,
        });
      }
    }
  }

  for (const group of groups.values()) {
    const rounds = Math.max(...group.map((e) => e.sets));
    for (let round = 1; round <= rounds; round++) {
      group.forEach((ex, i) => {
        steps.push({
          type: "exercise",
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          setNumber: round,
          totalSets: ex.sets,
          groupLabel: ex.groupLabel,
        });
        const isLastInRound = i === group.length - 1;
        const isLastRound = round === rounds;
        if (!isLastInRound) {
          const next = group[i + 1];
          steps.push({
            type: "rest",
            seconds: ex.restBetweenReps,
            reason: "betweenReps",
            nextExerciseName: next.name,
            nextSetLabel: `Set ${round} of ${next.sets}`,
          });
        } else if (!isLastRound) {
          steps.push({
            type: "rest",
            seconds: ex.restBetweenSets,
            reason: "betweenSets",
            nextExerciseName: group[0].name,
            nextSetLabel: `Set ${round + 1} of ${group[0].sets}`,
          });
        }
      });
    }
  }

  return steps;
}
