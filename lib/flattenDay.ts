import { PlannedExercise, ExecutionStep } from "./types";

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
          const lastTime = `${gEx.weight - 2.5}kg x ${gEx.reps}`;
          steps.push({
            type: "exercise",
            exerciseId: gEx.id,
            exerciseName: gEx.name,
            muscleGroup: gEx.muscleGroup,
            setNumber: round,
            totalSets: gEx.sets,
            groupLabel: gEx.groupLabel,
            weight: gEx.weight,
            reps: gEx.reps,
            lastTime,
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
      const lastTime = `${ex.weight - 2.5}kg x ${ex.reps}`;
      steps.push({
        type: "exercise",
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        setNumber: set,
        totalSets: ex.sets,
        weight: ex.weight,
        reps: ex.reps,
        lastTime,
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