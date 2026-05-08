import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Presentation, User, Users } from "lucide-react";
import { ActivityCard, FacilitationStyle } from "@/state/planTypes";

function toPreviewUrl(url: string): string {
  return url.replace(/\/view.*$/, '/preview');
}

interface ActivityDetailModalProps {
  activity: ActivityCard | null;
  initialTab?: 'teacher' | 'student';
  onClose: () => void;
  onTimeChange?: (activityId: string, minutes: number) => void;
}

const facilityStyleIcons: Record<FacilitationStyle, React.ReactNode> = {
  teacher: <Presentation className="h-4 w-4" />,
  individual: <User className="h-4 w-4" />,
  collaborative: <Users className="h-4 w-4" />
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

  const options = useMemo(() => {
    const all = [...baseOptions];
    if (originalMinutes && !all.includes(originalMinutes)) {
      all.push(originalMinutes);
      all.sort((a, b) => a - b);
    }
    return all;
  }, [originalMinutes]);

  const handleCustomSave = () => {
    const value = parseInt(customValue);
    if (!isNaN(value) && value > 0 && value <= 180) onChange(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={customValue}
          onChange={e => setCustomValue(e.target.value)}
          onBlur={handleCustomSave}
          onKeyPress={e => e.key === 'Enter' && handleCustomSave()}
          className="w-16 h-[30px] text-xs px-1 border-[#ccc] rounded-[5px]"
          min={1} max={180} autoFocus
        />
        <span className="text-xs text-[#707070]">min</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 h-[30px] px-3 border border-[#ccc] rounded-[5px] text-[14px] font-medium text-[#4a4a4a] hover:bg-gray-50 whitespace-nowrap">
          {minutes} Minutes
          <svg className="h-2.5 w-3.5 ml-1" viewBox="0 0 14 8" fill="none">
            <path d="M1 1l6 6 6-6" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[200]">
        {options.map(option => (
          <DropdownMenuItem
            key={option}
            onClick={() => onChange(option)}
            className={minutes === option ? "bg-accent" : ""}
          >
            <span>{option} Minutes{option === 10 ? ' (Recommended)' : ''}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => { setCustomValue(minutes.toString()); setIsEditing(true); }} className="text-primary">
          Custom
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ActivityDetailModal({ activity, initialTab = 'teacher', onClose, onTimeChange }: ActivityDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>(initialTab);

  useEffect(() => {
    if (!activity) return;
    // If the requested tab has no guide, fall back to the other tab
    const wantTeacher = initialTab === 'teacher';
    if (wantTeacher && !activity.teacherGuideUrl && activity.studentGuideUrl) {
      setActiveTab('student');
    } else if (!wantTeacher && !activity.studentGuideUrl && activity.teacherGuideUrl) {
      setActiveTab('teacher');
    } else {
      setActiveTab(initialTab);
    }
  }, [activity?.id, initialTab]);

  if (!activity) return null;

  const hasTeacherGuide = !!activity.teacherGuideUrl;
  const hasStudentGuide = !!activity.studentGuideUrl;

  const teacherGuideUrl = activity.teacherGuideUrl ? toPreviewUrl(activity.teacherGuideUrl) : null;
  const studentGuideUrl = activity.studentGuideUrl ? toPreviewUrl(activity.studentGuideUrl) : null;
  const guideUrl = activeTab === 'teacher' ? teacherGuideUrl : studentGuideUrl;

  return (
    <Dialog open={!!activity} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[900px] h-[870px] flex flex-col p-0 rounded-[20px] overflow-hidden gap-0">
        {/* Sticky header */}
        <div className="flex-shrink-0 bg-white px-[50px] pt-8 pb-0">
          {/* Optional badge */}
          {activity.optional && (
            <div className="mb-2">
              <span className="inline-block bg-[#f5f5f5] text-[#4a4a4a] text-[12px] font-medium rounded-[10px] px-3 py-1">
                Optional
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-[34px] font-bold text-[#4a4a4a] tracking-[-1.02px] leading-tight mb-4">
            {activity.title}
          </h2>

          {/* Metadata row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[#4a4a4a]">Facilitation Style:</span>
              {activity.styles.map(style => (
                <div key={style} className="flex items-center gap-1 text-[16px] text-[#4a4a4a]">
                  {facilityStyleIcons[style]}
                  <span>{facilityStyleLabels[style]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[#4a4a4a]">Time:</span>
              <TimeBadge
                minutes={activity.minutes}
                onChange={minutes => onTimeChange?.(activity.id, minutes)}
                originalMinutes={activity.originalMinutes}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#ccc] relative">
            {hasTeacherGuide && (
              <button
                className={`text-[14px] px-1 mr-8 pb-2 font-medium transition-colors ${
                  activeTab === 'teacher'
                    ? 'text-[#222] font-semibold'
                    : 'text-[#707070] hover:text-[#4a4a4a]'
                }`}
                onClick={() => setActiveTab('teacher')}
              >
                Teacher Guide
              </button>
            )}
            {hasStudentGuide && (
              <button
                className={`text-[14px] px-1 pb-2 font-medium transition-colors ${
                  activeTab === 'student'
                    ? 'text-[#222] font-semibold'
                    : 'text-[#707070] hover:text-[#4a4a4a]'
                }`}
                onClick={() => setActiveTab('student')}
              >
                Student Guide
              </button>
            )}
            {/* Active tab underline */}
            <div
              className="absolute bottom-0 h-[3px] bg-[#1e6fd4] transition-all"
              style={{
                left: activeTab === 'teacher' ? 0 : '144px',
                width: activeTab === 'teacher' ? '120px' : '108px',
              }}
            />
          </div>
        </div>

        {/* Scrollable iframe content */}
        <div className="flex-1 overflow-hidden px-[50px] py-4">
          {guideUrl ? (
            <iframe
              key={`${activity.id}-${activeTab}`}
              src={guideUrl}
              title={`${activeTab === 'teacher' ? 'Teacher' : 'Student'} Guide for ${activity.title}`}
              className="w-full h-full rounded-lg border border-[#eee]"
              allow="autoplay"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg border border-[#eee] bg-[#f9f9f9]">
              <p className="text-[#9b9b9b] text-[15px] font-medium">No guide available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-[#f5f5f5] h-[100px] flex items-center justify-end px-[30px] rounded-b-[20px]">
          <Button
            className="h-10 bg-[#ebebeb] hover:bg-[#ddd] text-[#4a4a4a] font-semibold rounded-[4px] px-5"
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
