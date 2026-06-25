export type ActivityTemplate = {
  title: string;
  minutes: number;
  optional: boolean;
  styles: string[];
  teacherGuideUrl?: string;
  studentGuideUrl?: string;
};

export type ModuleData = {
  activities: ActivityTemplate[];
  mustHaveTaskNames: string[];
  readLessonName?: string;
  coverImageUrl?: string;
  directInstructions?: { name: string; contentId?: string }[];
};

type ActivitiesIndex = Record<string, Record<string, Record<string, ModuleData>>>;

let cache: ActivitiesIndex | null = null;

async function load(): Promise<ActivitiesIndex> {
  if (cache) return cache;
  const res = await fetch('/wag-activities-data.json');
  cache = await res.json();
  return cache!;
}

export async function getModuleData(grade: number, unit: number, module: number): Promise<ModuleData | null> {
  const data = await load();
  return data[grade]?.[unit]?.[module] ?? null;
}

export async function getAvailableGrades(): Promise<number[]> {
  const data = await load();
  return Object.keys(data).map(Number).sort((a, b) => a - b);
}

export async function getAvailableUnits(grade: number): Promise<number[]> {
  const data = await load();
  const gradeData = data[grade];
  if (!gradeData) return [];
  return Object.keys(gradeData).map(Number).sort((a, b) => a - b);
}

export async function getAvailableModules(grade: number, unit: number): Promise<number[]> {
  const data = await load();
  const unitData = data[grade]?.[unit];
  if (!unitData) return [];
  return Object.keys(unitData)
    .map(Number)
    .sort((a, b) => a - b);
}

export async function getModuleName(grade: number, unit: number, module: number): Promise<string | null> {
  const data = await load();
  return data[grade]?.[unit]?.[module]?.readLessonName ?? null;
}

export async function getAllModuleNames(grade: number, unit: number): Promise<Record<number, string>> {
  const data = await load();
  const unitData = data[grade]?.[unit];
  if (!unitData) return {};
  return Object.fromEntries(
    Object.entries(unitData).map(([k, v]) => [Number(k), v.readLessonName ?? `Module ${k}`])
  );
}
