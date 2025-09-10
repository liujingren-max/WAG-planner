import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, User, Users, GraduationCap, ThumbsUp } from "lucide-react";
import { ActivityCard, FacilitationStyle } from "@/state/planTypes";

interface ActivityDetailModalProps {
  activity: ActivityCard | null;
  initialTab?: 'teacher' | 'student';
  onClose: () => void;
  onTimeChange?: (activityId: string, minutes: number) => void;
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

function TimeBadge({ minutes, onChange, originalMinutes }: { minutes: number; onChange: (m: number) => void; originalMinutes?: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const baseOptions = [2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 30];
  
  // Add originalMinutes to options if it's not already in the list
  const options = useMemo(() => {
    const allOptions = [...baseOptions];
    if (originalMinutes && !allOptions.includes(originalMinutes)) {
      allOptions.push(originalMinutes);
      allOptions.sort((a, b) => a - b);
    }
    return allOptions;
  }, [originalMinutes]);

  const handleCustomSelect = () => {
    setCustomValue(minutes.toString());
    setIsEditing(true);
  };

  const handleCustomSave = () => {
    const value = parseInt(customValue);
    if (!isNaN(value) && value > 0 && value <= 180) {
      onChange(value);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSave();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onBlur={handleCustomSave}
          onKeyPress={handleKeyPress}
          className="w-16 h-6 text-xs px-1"
          min={1}
          max={180}
          autoFocus
        />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge variant="outline" className="cursor-pointer select-none gap-1 hover:bg-muted">
          <Clock className="h-3.5 w-3.5" />
          {minutes} min
          <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-50">
        {options.map((option) => (
          <DropdownMenuItem 
            key={option} 
            onClick={() => onChange(option)}
            className={minutes === option ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2 w-full">
              <span>{option} min</span>
              {originalMinutes === option && (
                <ThumbsUp className="h-3.5 w-3.5 text-primary ml-auto" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={handleCustomSelect} className="text-primary">
          Custom
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ActivityDetailModal({ activity, initialTab = 'teacher', onClose, onTimeChange }: ActivityDetailModalProps) {
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
            <TimeBadge 
              minutes={activity.minutes} 
              onChange={(minutes) => onTimeChange?.(activity.id, minutes)}
              originalMinutes={activity.originalMinutes}
            />
            
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
                    style={{ marginTop: '-3px' }}
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