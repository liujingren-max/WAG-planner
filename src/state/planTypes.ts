export type FacilitationStyle = "teacher" | "individual" | "collaborative";

export interface ActivityCard {
  id: string;
  title: string;
  minutes: number;
  optional?: boolean;
  styles: FacilitationStyle[];
  handoutUrl?: string;
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
