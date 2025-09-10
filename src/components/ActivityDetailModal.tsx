import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Users, GraduationCap } from "lucide-react";
import { ActivityCard, FacilitationStyle } from "@/state/planTypes";

interface ActivityDetailModalProps {
  activity: ActivityCard | null;
  initialTab?: 'teacher' | 'student';
  onClose: () => void;
}

const facilityStyleIcons: Record<FacilitationStyle, React.ReactNode> = {
  teacher: <GraduationCap className="h-3 w-3" />,
  individual: <User className="h-3 w-3" />,
  collaborative: <Users className="h-3 w-3" />
};

const facilityStyleLabels: Record<FacilitationStyle, string> = {
  teacher: "Teacher-led",
  individual: "Individual",
  collaborative: "Collaborative"
};

export default function ActivityDetailModal({ activity, initialTab = 'teacher', onClose }: ActivityDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>(initialTab);

  // Reset tab when activity or initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [activity?.id, initialTab]);

  if (!activity) return null;

  const hasTeacherGuide = !!activity.teacherGuide;
  const hasStudentGuide = !!activity.studentGuide;

  // Set active tab to available tab if current tab is not available
  const effectiveTab = activeTab === 'teacher' && !hasTeacherGuide 
    ? 'student' 
    : activeTab === 'student' && !hasStudentGuide 
      ? 'teacher' 
      : activeTab;

  return (
    <Dialog open={!!activity} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* Header with title and metadata */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xl font-semibold">{activity.title}</h2>
            {activity.optional && (
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{activity.minutes} min</span>
            </div>
            
            <div className="flex items-center gap-2">
              {activity.styles.map((style) => (
                <div key={style} className="flex items-center gap-1">
                  {facilityStyleIcons[style]}
                  <span className="text-xs">{facilityStyleLabels[style]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs that stick out */}
        <div className="px-6 flex-shrink-0">
          <div className="flex border-b">
            {hasTeacherGuide && (
              <Button
                variant={effectiveTab === 'teacher' ? 'default' : 'ghost'}
                className="rounded-b-none px-4 py-2"
                onClick={() => setActiveTab('teacher')}
              >
                Teacher Guide
              </Button>
            )}
            {hasStudentGuide && (
              <Button
                variant={effectiveTab === 'student' ? 'default' : 'ghost'}
                className="rounded-b-none px-4 py-2"
                onClick={() => setActiveTab('student')}
              >
                Student Guide
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {effectiveTab === 'teacher' && hasTeacherGuide && (
                <div className="flex justify-center">
                  <img
                    src={activity.teacherGuide}
                    alt={`Teacher guide for ${activity.title}`}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              )}

              {effectiveTab === 'student' && hasStudentGuide && (
                <div className="flex justify-center">
                  <img
                    src={activity.studentGuide}
                    alt={`Student guide for ${activity.title}`}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              )}

              {(!hasTeacherGuide && !hasStudentGuide) && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No guides available for this activity
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}