export type FacilitationStyle = "teacher" | "individual" | "collaborative";

export interface ActivityCard {
  id: string;
  title: string;
  minutes: number;
  originalMinutes?: number; // The original time estimate from database
  optional?: boolean;
  styles: FacilitationStyle[];
  studentGuide?: string;
  teacherGuide?: string;
}

export interface SessionColumn {
  id: string;
  name: string;
  availableMinutes: number;
  activities: ActivityCard[];
}

export interface LessonPlan {
  id: string;
  title: string;
  grade: number; // 6-12
  unit: number; // 1-7
  module: number; // 1-8
  sessions: SessionColumn[];
  deleted: ActivityCard[]; // recently deleted
}
