import { LessonPlan } from "@/state/planTypes";

// All available tasks in EXACT sequence order
export const allTasks = [{
  title: "Preview Key Skills and Concepts",
  minutes: 3,
  optional: true,
  styles: ["teacher"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_12#slide=id.g3739fcbb8b8_0_12"
}, {
  title: "Direct Instruction: Determining Theme and Author's Message in a Personal Narrative",
  minutes: 15,
  optional: false,
  styles: ["teacher"]
}, {
  title: "Direct Instruction: Organizing Narrative Writing",
  minutes: 30,
  optional: false,
  styles: ["teacher"]
}, {
  title: "Quick Journal - Write",
  minutes: 5,
  optional: true,
  styles: ["individual"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_33#slide=id.g3739fcbb8b8_0_33"
}, {
  title: "Build Your Vocabulary - Instruction",
  minutes: 5,
  optional: false,
  styles: ["teacher", "individual", "collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_43#slide=id.g3739fcbb8b8_0_43"
}, {
  title: "Build Your Vocabulary - Collaboration",
  minutes: 10,
  optional: false,
  styles: ["teacher", "individual", "collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_43#slide=id.g3739fcbb8b8_0_43"
}, {
  title: "Topic Overview - Read",
  minutes: 2,
  optional: false,
  styles: ["individual"]
}, {
  title: "Vocabulary - Introduce Best Practice",
  minutes: 5,
  optional: false,
  styles: ["teacher"]
}, {
  title: "Vocabulary - Engage with Focus Words",
  minutes: 10,
  optional: false,
  styles: ["collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_60#slide=id.g3739fcbb8b8_0_60"
}, {
  title: "Connect - Write",
  minutes: 3,
  optional: false,
  styles: ["individual"]
}, {
  title: "Connect - Pair and Share",
  minutes: 2,
  optional: false,
  styles: ["collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_72#slide=id.g3739fcbb8b8_0_72"
}, {
  title: "Read",
  minutes: 20,
  optional: false,
  styles: ["individual"]
}, {
  title: "Share your Reflections",
  minutes: 10,
  optional: true,
  styles: ["collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_83#slide=id.g3739fcbb8b8_0_83"
}, {
  title: "Check",
  minutes: 7,
  optional: false,
  styles: ["individual"]
}, {
  title: "Apply Your Learning",
  minutes: 12,
  optional: false,
  styles: ["individual", "collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_97#slide=id.g3739fcbb8b8_0_97"
}, {
  title: "Analyze",
  minutes: 15,
  optional: false,
  styles: ["teacher", "individual", "collaborative"]
}, {
  title: "Summarize",
  minutes: 7,
  optional: false,
  styles: ["individual"]
}, {
  title: "Write to Impress - Review",
  minutes: 7,
  optional: false,
  styles: ["individual", "collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_108#slide=id.g3739fcbb8b8_0_108"
}, {
  title: "Write to Impress - Practice",
  minutes: 5,
  optional: false,
  styles: ["teacher", "individual", "collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_108#slide=id.g3739fcbb8b8_0_108"
}, {
  title: "Appreciate Author's Craft",
  minutes: 10,
  optional: true,
  styles: ["individual"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_120#slide=id.g3739fcbb8b8_0_120"
}, {
  title: "Develop",
  minutes: 20,
  optional: false,
  styles: ["individual"]
}, {
  title: "Share Your Plan",
  minutes: 10,
  optional: true,
  styles: ["individual", "collaborative"],
  handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_131#slide=id.g3739fcbb8b8_0_131"
}, {
  title: "Draft",
  minutes: 20,
  optional: true,
  styles: ["individual", "collaborative"]
}, {
  title: "Review/Revise",
  minutes: 15,
  optional: true,
  styles: ["individual"]
}];

// Must-have tasks (Develop is required)
export const mustHaveTaskNames = ["Develop"];

// Helper function to get time adjustment range for an activity
export const getTimeAdjustmentRange = (minutes: number) => {
  if (minutes <= 1) return { min: 0, max: 0 };
  if (minutes <= 3) return { min: -1, max: 2 };
  if (minutes <= 5) return { min: -2, max: 2 };
  if (minutes <= 10) return { min: -2, max: 3 };
  if (minutes <= 20) return { min: -3, max: 5 };
  return { min: -5, max: 5 };
};

export interface PlanningOptions {
  times: number[];
  grade?: number;
  unit?: number;
  module?: number;
  preserveCustomizations?: boolean;
  existingPlan?: LessonPlan;
}

export function generateLessonPlan(options: PlanningOptions): LessonPlan {
  const { times, grade = 8, unit = 1, module = 2, preserveCustomizations = false, existingPlan } = options;
  const totalMinutes = times.reduce((a, b) => a + b, 0);
  const id = existingPlan?.id || crypto.randomUUID();

  // Step 1: Start with all activities in sequence order
  let workingTasks = allTasks.map(task => ({
    ...task,
    originalMinutes: task.minutes // Store the recommended time for thumbs up icon
  }));

  // If preserving customizations, try to match with existing activities
  if (preserveCustomizations && existingPlan) {
    const existingActivities = existingPlan.sessions.flatMap(s => s.activities);
    workingTasks = workingTasks.map(task => {
      const existing = existingActivities.find(a => a.title === task.title);
      if (existing) {
        return {
          ...task,
          minutes: existing.minutes, // Use the user's customized time
          originalMinutes: existing.originalMinutes || task.minutes // Preserve original if available
        };
      }
      return task;
    });
  }

  // Calculate initial total time
  let totalTaskTime = workingTasks.reduce((sum, task) => sum + task.minutes, 0);

  // Step 2: If exceeds total time by more than 5 minutes per session on average, remove optional activities
  const targetTime = totalMinutes;
  const tolerance = 5 * times.length; // 5 minutes tolerance per session

  if (totalTaskTime > targetTime + tolerance) {
    // Remove optional activities one by one until we're closer to target
    let optionalTasks = workingTasks.filter(task => task.optional);
    while (totalTaskTime > targetTime + tolerance && optionalTasks.length > 0) {
      // Remove the last optional task to preserve sequence as much as possible
      let lastOptionalIndex = -1;
      for (let i = workingTasks.length - 1; i >= 0; i--) {
        if (workingTasks[i].optional) {
          lastOptionalIndex = i;
          break;
        }
      }
      if (lastOptionalIndex !== -1) {
        const removed = workingTasks.splice(lastOptionalIndex, 1)[0];
        totalTaskTime -= removed.minutes;
        optionalTasks = optionalTasks.filter(t => t.title !== removed.title);
      }
    }
  }

  // Step 3: Try to optimize time by adjusting activity durations
  const sessions = times.map((t, idx) => ({
    id: (existingPlan?.sessions[idx]?.id) || crypto.randomUUID(),
    name: (existingPlan?.sessions[idx]?.name) || `Session ${idx + 1}`,
    availableMinutes: t,
    activities: [] as LessonPlan["sessions"][number]["activities"],
    currentTime: 0
  }));

  // Distribute activities across sessions in sequence order
  let currentSessionIndex = 0;
  for (const task of workingTasks) {
    // Find the next session that can fit this task
    let placed = false;
    for (let i = currentSessionIndex; i < sessions.length && !placed; i++) {
      if (sessions[i].currentTime + task.minutes <= sessions[i].availableMinutes + 5) {
        sessions[i].activities.push({
          id: crypto.randomUUID(),
          title: task.title,
          minutes: task.minutes,
          originalMinutes: task.originalMinutes,
          optional: !!task.optional,
          styles: task.styles as any,
          studentGuide: undefined,
          teacherGuide: undefined
        });
        sessions[i].currentTime += task.minutes;
        currentSessionIndex = i;
        placed = true;
      }
    }

    // If we couldn't place it, put it in the last session anyway
    if (!placed) {
      const lastSession = sessions[sessions.length - 1];
      lastSession.activities.push({
        id: crypto.randomUUID(),
        title: task.title,
        minutes: task.minutes,
        originalMinutes: task.originalMinutes,
        optional: !!task.optional,
        styles: task.styles as any,
        studentGuide: undefined,
        teacherGuide: undefined
      });
      lastSession.currentTime += task.minutes;
    }
  }

  // Step 4: Optimize each session's timing
  for (const session of sessions) {
    const difference = session.currentTime - session.availableMinutes;
    if (Math.abs(difference) > 5) {
      // Sort activities by duration (longer first for adjustments)
      const sortedActivities = [...session.activities].sort((a, b) => b.minutes - a.minutes);
      if (difference > 0) {
        // Session is too long - try to reduce time
        let timeToReduce = difference;
        for (const activity of sortedActivities) {
          if (timeToReduce <= 0) break;
          const range = getTimeAdjustmentRange(activity.originalMinutes || activity.minutes);
          const reduction = Math.min(timeToReduce, Math.abs(range.min));
          if (reduction > 0 && activity.minutes - reduction > 0) {
            activity.minutes -= reduction;
            session.currentTime -= reduction;
            timeToReduce -= reduction;
          }
        }
      } else {
        // Session is too short - try to increase time
        let timeToAdd = Math.abs(difference);
        for (const activity of sortedActivities) {
          if (timeToAdd <= 0) break;
          const range = getTimeAdjustmentRange(activity.originalMinutes || activity.minutes);
          const addition = Math.min(timeToAdd, range.max);
          if (addition > 0) {
            activity.minutes += addition;
            session.currentTime += addition;
            timeToAdd -= addition;
          }
        }
      }
    }
  }

  // Step 5: If still can't fit and sessions are significantly over, remove non-essential activities
  for (const session of sessions) {
    while (session.currentTime > session.availableMinutes + 10) {
      // Find the last non-essential activity to remove
      let removedIndex = -1;
      for (let i = session.activities.length - 1; i >= 0; i--) {
        const activity = session.activities[i];
        if (!mustHaveTaskNames.includes(activity.title)) {
          removedIndex = i;
          break;
        }
      }
      if (removedIndex !== -1) {
        const removed = session.activities.splice(removedIndex, 1)[0];
        session.currentTime -= removed.minutes;
      } else {
        break; // Can't remove any more without touching must-haves
      }
    }
  }

  // Clean up the currentTime property before returning
  const finalSessions = sessions.map(session => ({
    id: session.id,
    name: session.name,
    availableMinutes: session.availableMinutes,
    activities: session.activities
  }));

  return {
    id,
    title: `Grade ${grade}, Unit ${unit}, Module ${module} – I'm the Greatest`,
    grade,
    unit,
    module,
    sessions: finalSessions,
    deleted: existingPlan?.deleted || []
  } as LessonPlan;
}