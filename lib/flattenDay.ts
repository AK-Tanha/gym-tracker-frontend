import { PlannedExercise, ExecutionStep } from "./types";

export function exerciseLabel(ex: PlannedExercise): string {
  if (ex.unit === "time") {
    return ex.weight > 0 ? `${ex.weight}kg × ${ex.duration}s` : `${ex.duration}s`;
  }
  return `${ex.weight}kg × ${ex.reps}`;
}

export function flattenDay(exercises: PlannedExercise[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];

  const groups = new Map<string, PlannedExercise[]>();
  const processedGroups = new Set<string>();

  for (const ex of exercises) {
    if (ex.groupId) {
      const arr = groups.get(ex.groupId) ?? [];
      arr.push(ex);
      groups.set(ex.groupId, arr);
    }
  }

  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];

    if (ex.groupId) {
      const groupKey = ex.groupId;
      if (processedGroups.has(groupKey)) {
        i++;
        continue;
      }
      processedGroups.add(groupKey);

      const group = groups.get(groupKey)!;
      const rounds = Math.max(...group.map((e) => e.sets));

      for (let round = 1; round <= rounds; round++) {
        group.forEach((gEx, gi) => {
          steps.push({
            type: "exercise",
            exerciseId: gEx.id,
            exerciseName: gEx.name,
            muscleGroup: gEx.muscleGroup,
            unit: gEx.unit ?? "reps",
            setNumber: round,
            totalSets: gEx.sets,
            groupLabel: gEx.groupLabel,
            weight: gEx.weight,
            reps: gEx.reps,
            duration: gEx.duration,
            lastTime: exerciseLabel(gEx),
          });
          const isLastInRound = gi === group.length - 1;
          const isLastRound = round === rounds;
          if (!isLastInRound) {
            const next = group[gi + 1];
            steps.push({
              type: "rest",
              seconds: gEx.restBetweenReps,
              reason: "betweenReps",
              nextExerciseName: next.name,
              nextSetLabel: `Set ${round} of ${next.sets}`,
            });
          } else if (!isLastRound) {
            steps.push({
              type: "rest",
              seconds: gEx.restBetweenSets,
              reason: "betweenSets",
              nextExerciseName: group[0].name,
              nextSetLabel: `Set ${round + 1} of ${group[0].sets}`,
            });
          }
        });
      }

      i++;
      continue;
    }

    for (let set = 1; set <= ex.sets; set++) {
      steps.push({
        type: "exercise",
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        unit: ex.unit ?? "reps",
        setNumber: set,
        totalSets: ex.sets,
        weight: ex.weight,
        reps: ex.reps,
        duration: ex.duration,
        lastTime: exerciseLabel(ex),
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

    i++;
  }

  return steps;
}