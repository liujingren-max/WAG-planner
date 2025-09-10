import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LessonPlan } from "@/state/planTypes";
interface SparkySheetProps {
  onCreated?: (plan: LessonPlan) => void;
}
const fixedGrade = 8;
const fixedUnit = 1;
const fixedModule = 2;
const range = (start: number, end: number) => Array.from({
  length: end - start + 1
}, (_, i) => start + i);
export default function SparkySheet({
  onCreated
}: SparkySheetProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Step state
  const [sessionsCount, setSessionsCount] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(50);
  const [customTimes, setCustomTimes] = useState<number[] | null>(null);
  const totalMinutes = useMemo(() => {
    const times = customTimes ?? Array.from({
      length: sessionsCount
    }, () => sessionMinutes);
    return times.reduce((a, b) => a + b, 0);
  }, [customTimes, sessionMinutes, sessionsCount]);
  useEffect(() => {
    if (open) {
      // Reset defaults each time opened
      setSessionsCount(4);
      setSessionMinutes(50);
      setCustomTimes(null);
    }
  }, [open]);
  const disabledOption = (value: number, fixed: number) => value !== fixed;
  function createPlan(): LessonPlan {
    const times = customTimes ?? Array.from({
      length: sessionsCount
    }, () => sessionMinutes);
    const id = crypto.randomUUID();

    // All available tasks in EXACT sequence order
    const allTasks = [{
      title: "Preview Key Skills and Concepts",
      minutes: 3,
      optional: true,
      styles: ["teacher"],
      student: "/lovable-uploads/2a542771-e92a-4362-af19-0669bcb45b9b.png",
      teacher: "/lovable-uploads/f06d27e7-b14d-4d51-a79b-ea843bf72968.png"
    }, {
      title: "Direct Instruction: Determining Theme and Author's Message in a Personal Narrative",
      minutes: 15,
      optional: false,
      styles: ["teacher"],
      teacher: "/lovable-uploads/teacher-guide/direct-instruction-organizing-narrative.png"
    }, {
      title: "Direct Instruction: Organizing Narrative Writing",
      minutes: 30,
      optional: false,
      styles: ["teacher"],
      teacher: "/lovable-uploads/teacher-guide/direct-instruction-organizing-narrative.png"
    }, {
      title: "Quick Journal - Write",
      minutes: 5,
      optional: true,
      styles: ["individual"],
      student: "/lovable-uploads/733ff7e7-c09e-40c6-a610-254946d51f7b.png",
      teacher: "/lovable-uploads/18fbe654-8363-4dcc-b530-a7963270b0f1.png"
    }, {
      title: "Build Your Vocabulary - Instruction",
      minutes: 5,
      optional: false,
      styles: ["teacher", "individual", "collaborative"],
      student: "/lovable-uploads/6b6215cb-94f7-44d1-bfcf-da1d451926e5.png",
      teacher: "/lovable-uploads/teacher-guide/build-your-vocabulary.png"
    }, {
      title: "Build Your Vocabulary - Collaboration",
      minutes: 10,
      optional: false,
      styles: ["teacher", "individual", "collaborative"],
      student: "/lovable-uploads/6b6215cb-94f7-44d1-bfcf-da1d451926e5.png",
      teacher: "/lovable-uploads/teacher-guide/build-your-vocabulary.png"
    }, {
      title: "Topic Overview",
      minutes: 2,
      optional: false,
      styles: ["individual"],
      teacher: "/lovable-uploads/4dcb6b6e-5414-4cdc-9851-16fcda12412b.png"
    }, {
      title: "Vocabulary - Introduce Best Practice",
      minutes: 5,
      optional: false,
      styles: ["teacher"],
      teacher: "/lovable-uploads/teacher-guide/list-group-label.png"
    }, {
      title: "Vocabulary - Engage with Focus Words",
      minutes: 10,
      optional: false,
      styles: ["collaborative"],
      student: "/lovable-uploads/d0c0bb54-f96a-400e-bfc4-efc6a3b76ea1.png",
      teacher: "/lovable-uploads/teacher-guide/list-group-label.png"
    }, {
      title: "Connect - Write",
      minutes: 3,
      optional: false,
      styles: ["individual"],
      student: "/lovable-uploads/7c9d2a5f-e504-4f1a-a18b-e04bd6f35ce2.png",
      teacher: "/lovable-uploads/38adbe31-27fd-4a70-b773-09d18e593df9.png"
    }, {
      title: "Connect - Pair and Share",
      minutes: 2,
      optional: false,
      styles: ["collaborative"],
      student: "/lovable-uploads/7c9d2a5f-e504-4f1a-a18b-e04bd6f35ce2.png",
      teacher: "/lovable-uploads/38adbe31-27fd-4a70-b773-09d18e593df9.png"
    }, {
      title: "Read",
      minutes: 20,
      optional: false,
      styles: ["individual"],
      teacher: "/lovable-uploads/teacher-guide/read-activity.png"
    }, {
      title: "Share your Reflections",
      minutes: 10,
      optional: true,
      styles: ["collaborative"],
      student: "/lovable-uploads/b0ad8338-aae3-4405-9d12-fcd4a8f74e18.png",
      teacher: "/lovable-uploads/083d1317-7aec-43f5-a4fa-4ca1739c030c.png"
    }, {
      title: "Check",
      minutes: 7,
      optional: false,
      styles: ["individual"],
      teacher: "/lovable-uploads/teacher-guide/check-activity.png"
    }, {
      title: "Apply Your Learning",
      minutes: 12,
      optional: false,
      styles: ["individual", "collaborative"],
      student: "/lovable-uploads/4b10fece-102f-4966-812c-e5425b4bd012.png",
      teacher: "/lovable-uploads/7a5ae14c-bdb7-463c-9995-275c46ce8aaa.png"
    }, {
      title: "Analyze",
      minutes: 15,
      optional: false,
      styles: ["teacher", "individual", "collaborative"],
      teacher: "/lovable-uploads/T-Analyze.png"
    }, {
      title: "Summarize",
      minutes: 7,
      optional: false,
      styles: ["individual"],
      teacher: "/lovable-uploads/teacher-guide/summarize-activity.png"
    }, {
      title: "Write to Impress - Review",
      minutes: 7,
      optional: false,
      styles: ["individual", "collaborative"],
      student: "/lovable-uploads/fb633020-d3b3-49a0-aff2-4abc93c98da9.png",
      teacher: "/lovable-uploads/teacher-guide/write-to-impress.png"
    }, {
      title: "Write to Impress - Practice",
      minutes: 5,
      optional: false,
      styles: ["teacher", "individual", "collaborative"],
      student: "/lovable-uploads/fb633020-d3b3-49a0-aff2-4abc93c98da9.png",
      teacher: "/lovable-uploads/teacher-guide/write-to-impress.png"
    }, {
      title: "Appreciate Author's Craft",
      minutes: 10,
      optional: true,
      styles: ["individual"],
      student: "/lovable-uploads/989994ad-b836-4ebe-8a37-efa2b43dea1c.png",
      teacher: "/lovable-uploads/teacher-guide/appreciate-authors-craft.png"
    }, {
      title: "Develop",
      minutes: 20,
      optional: false,
      styles: ["individual"],
      teacher: "/src/lovable-uploads/teacher-guide/develop-share-plan.png"
    }, {
      title: "Share Your Plan",
      minutes: 10,
      optional: true,
      styles: ["individual", "collaborative"],
      student: "/lovable-uploads/0358d2c9-d61b-4366-a544-4ee7b7708a92.png",
      teacher: "/src/lovable-uploads/teacher-guide/develop-share-plan.png"
    }, {
      title: "Draft",
      minutes: 20,
      optional: true,
      styles: ["individual", "collaborative"],
      teacher: "/lovable-uploads/teacher-guide/draft-and-review.png"
    }, {
      title: "Review/Revise",
      minutes: 15,
      optional: true,
      styles: ["individual"],
      teacher: "/lovable-uploads/teacher-guide/draft-and-review.png"
    }];

    // Must-have tasks (Develop is required)
    const mustHaveTaskNames = ["Develop"];

    // Helper function to get time adjustment range for an activity
    const getTimeAdjustmentRange = (minutes: number) => {
      if (minutes <= 1) return {
        min: 0,
        max: 0
      };
      if (minutes <= 3) return {
        min: -1,
        max: 2
      };
      if (minutes <= 5) return {
        min: -2,
        max: 2
      };
      if (minutes <= 10) return {
        min: -2,
        max: 3
      };
      if (minutes <= 20) return {
        min: -3,
        max: 5
      };
      return {
        min: -5,
        max: 5
      };
    };

    // Step 1: Start with all activities in sequence order
    let workingTasks = allTasks.map(task => ({
      ...task
    })); // Deep copy to avoid mutating original

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
      id: crypto.randomUUID(),
      name: `Session ${idx + 1}`,
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
            originalMinutes: task.minutes,
            // Store the original database time
            optional: !!task.optional,
            styles: task.styles as any,
            studentGuide: task.student,
            teacherGuide: task.teacher
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
          originalMinutes: task.minutes,
          // Store the original database time
          optional: !!task.optional,
          styles: task.styles as any,
            studentGuide: task.student,
            teacherGuide: task.teacher
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
            const range = getTimeAdjustmentRange(activity.minutes);
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
            const range = getTimeAdjustmentRange(activity.minutes);
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
      title: `Grade ${fixedGrade}, Unit ${fixedUnit}, Module ${fixedModule} – I'm the Greatest`,
      grade: fixedGrade,
      unit: fixedUnit,
      module: fixedModule,
      sessions: finalSessions,
      deleted: []
    } as LessonPlan;
  }
  function handleGenerate() {
    if (customTimes && customTimes.some(t => t <= 0)) {
      toast({
        title: "Invalid session time",
        description: "Please enter positive minutes for all sessions."
      });
      return;
    }
    const plan = createPlan();

    // Save to localStorage
    const existingRaw = localStorage.getItem("plans");
    const list: LessonPlan[] = existingRaw ? JSON.parse(existingRaw) : [];
    list.push(plan);
    localStorage.setItem("plans", JSON.stringify(list));
    onCreated?.(plan);
    setOpen(false);
    navigate(`/plan/${plan.id}`);
  }
  const timesArray = customTimes ?? Array.from({
    length: sessionsCount
  }, () => sessionMinutes);
  return <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg">Create new lesson plan</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[560px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> Sparky
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-6">
          <div className="space-y-6 pr-4">
            <Card>
              <CardHeader>
                <CardTitle>Let's start planning!</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Grade</Label>
                  <Select defaultValue={String(fixedGrade)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {range(6, 12).map(g => <SelectItem key={g} value={String(g)} disabled={disabledOption(g, fixedGrade)}>
                          Grade {g}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select defaultValue={String(fixedUnit)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {range(1, 7).map(u => <SelectItem key={u} value={String(u)} disabled={disabledOption(u, fixedUnit)}>
                          Unit {u}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Module</Label>
                  <Select defaultValue={String(fixedModule)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {range(1, 8).map(m => <SelectItem key={m} value={String(m)} disabled={disabledOption(m, fixedModule)}>
                          Module {m}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How many sessions and minutes do you have?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                

                <div className="space-y-4">
                  <div>
                    <span>I plan to implement the module in</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">

                    <Select value={String(sessionsCount)} onValueChange={v => setSessionsCount(Number(v))}>
                      <SelectTrigger className="w-auto min-w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {range(1, 10).map(num => <SelectItem key={num} value={String(num)}>
                            {num}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span>sessions,</span>
                  </div>
                  <div>
                    <span>and each session has</span>
                  </div>
                    
                  <div className="flex items-center gap-2 text-sm">
                    
                    <Select value={String(sessionMinutes)} onValueChange={v => setSessionMinutes(Number(v))} disabled={!!customTimes}>
                      <SelectTrigger className="w-auto min-w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[20, 25, 30, 35, 40, 45, 50, 60, 80, 90].map(min => <SelectItem key={min} value={String(min)}>
                            {min}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span>minutes.</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="custom" checked={!!customTimes} onCheckedChange={v => setCustomTimes(v ? Array.from({
                    length: sessionsCount
                  }, () => sessionMinutes) : null)} />
                    <Label htmlFor="custom">Custom session time</Label>
                  </div>
                  {customTimes && <div className="space-y-3">
                      {timesArray.map((t, i) => <div key={i} className="flex items-center gap-2 group">
                          <Label className="w-20 text-sm">Session {i + 1}</Label>
                          <Select value={String(t)} onValueChange={v => {
                      const arr = [...timesArray];
                      arr[i] = Number(v);
                      setCustomTimes(arr);
                    }}>
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[20, 25, 30, 35, 40, 45, 50, 60, 80, 90].map(min => <SelectItem key={min} value={String(min)}>
                                  {min} minutes
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                      if (timesArray.length > 1) {
                        const arr = timesArray.filter((_, idx) => idx !== i);
                        setCustomTimes(arr);
                      }
                    }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>)}
                      <Button variant="secondary" onClick={() => setCustomTimes([...timesArray, sessionMinutes])} className="w-full">
                        Add session
                      </Button>
                    </div>}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Recommend total time: 150–250 min.
                  </div>
                  <div className="text-sm font-medium">
                    Your Total time: {totalMinutes} min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    You can set your own time — we'll help you adjust activities to fit.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pb-4">
              <Button size="lg" onClick={handleGenerate}>Confirm & Generate lesson plan</Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>;
}