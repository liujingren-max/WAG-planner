import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Users, GraduationCap, X } from "lucide-react";
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">{activity.title}</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b mb-4">
            {hasTeacherGuide && (
              <Button
                variant={effectiveTab === 'teacher' ? 'default' : 'ghost'}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                onClick={() => setActiveTab('teacher')}
              >
                Teacher Guide
              </Button>
            )}
            {hasStudentGuide && (
              <Button
                variant={effectiveTab === 'student' ? 'default' : 'ghost'}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                onClick={() => setActiveTab('student')}
              >
                Student Guide
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {effectiveTab === 'teacher' && hasTeacherGuide && (
              <div className="space-y-4">
                {/* Activity Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{activity.title}</h3>
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

                {/* Teacher Guide Image */}
                <div className="flex justify-center">
                  <img
                    src={activity.teacherGuide}
                    alt={`Teacher guide for ${activity.title}`}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}