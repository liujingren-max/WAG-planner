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

    // All available tasks with their properties
    const allTasks = [
      {
        title: "Preview Key Skills and Concepts",
        minutes: 3,
        optional: true,
        styles: ["teacher"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_12#slide=id.g3739fcbb8b8_0_12"
      },
      {
        title: "Direct Instruction: Determining Theme and Author's Message in a Personal Narrative",
        minutes: 15,
        optional: false,
        styles: ["teacher"]
      },
      {
        title: "Direct Instruction: Organizing Narrative Writing",
        minutes: 30,
        optional: false,
        styles: ["teacher"]
      },
      {
        title: "Quick Journal - Write",
        minutes: 5,
        optional: true,
        styles: ["individual"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_33#slide=id.g3739fcbb8b8_0_33"
      },
      {
        title: "Build Your Vocabulary - Instruction",
        minutes: 5,
        optional: false,
        styles: ["teacher", "individual", "collaborative"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_43#slide=id.g3739fcbb8b8_0_43"
      },
      {
        title: "Build Your Vocabulary - Collaboration",
        minutes: 10,
        optional: false,
        styles: ["teacher", "individual", "collaborative"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_43#slide=id.g3739fcbb8b8_0_43"
      },
      {
        title: "Topic Overview - Read",
        minutes: 2,
        optional: false,
        styles: ["individual"]
      },
      {
        title: "Vocabulary - Introduce Best Practice",
        minutes: 5,
        optional: false,
        styles: ["teacher"]
      },
      {
        title: "Vocabulary - Engage with Focus Words",
        minutes: 10,
        optional: false,
        styles: ["collaborative"],
        handoutUrl:"https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_60#slide=id.g3739fcbb8b8_0_60"
      },
      {
        title: "Connect - Write",
        minutes: 3,
        optional: false,
        styles: ["individual"],
      },
      {
        title: "Connect - Pair and Share",
        minutes: 2,
        optional: false,
        styles: ["collaborative"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_72#slide=id.g3739fcbb8b8_0_72"
      },
      {
        title: "Read",
        minutes: 20,
        optional: false,
        styles: ["individual"]
      },
      {
        title: "Share your Reflections",
        minutes: 10,
        optional: true,
        styles: ["collaborative"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_83#slide=id.g3739fcbb8b8_0_83"
      },
      {
        title: "Check",
        minutes: 7,
        optional: false,
        styles: ["individual"]
      },
      {
        title: "Apply Your Learning",
        minutes: 12,
        optional: false,
        styles: ["individual", "collaborative"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_97#slide=id.g3739fcbb8b8_0_97"
      },
      {
        title: "Analyze",
        minutes: 15,
        optional: false,
        styles: ["teacher", "individual", "collaborative"]
      },
      {
        title: "Summarize",
        minutes: 7,
        optional: false,
        styles: ["individual"]
      },
      {
        title: "Write to Impress - Review",
        minutes: 7,
        optional: false,
        styles: ["individual", "collaborative"],
        handoutUrl:"https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_108#slide=id.g3739fcbb8b8_0_108"
      },
      {
        title: "Write to Impress - Practice",
        minutes: 5,
        optional: false,
        styles: ["teacher", "individual", "collaborative"],
        handoutUrl:"https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_108#slide=id.g3739fcbb8b8_0_108"

      },
      {
        title: "Appreciate Author's Craft",
        minutes: 10,
        optional: true,
        styles: ["individual"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_120#slide=id.g3739fcbb8b8_0_120"
      },
      {
        title: "Develop",
        minutes: 20,
        optional: false,
        styles: ["individual"]
      },
      {
        title: "Share Your Plan",
        minutes: 10,
        optional: true,
        styles: ["individual", "collaborative"],
        handoutUrl: "https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g3739fcbb8b8_0_131#slide=id.g3739fcbb8b8_0_131"
      },
      {
        title: "Draft",
        minutes: 20,
        optional: false, // Must-have
        styles: ["individual", "collaborative"]
      },
      {
        title: "Review/Revise",
        minutes: 15,
        optional: true,
        styles: ["individual"]
      }
    ];

    // Must-have tasks (Develop and Draft are required)
    const mustHaveTasks = allTasks.filter(task => 
      task.title === "Develop" || task.title === "Draft"
    );
    
    // Other essential and optional tasks
    const otherEssentialTasks = allTasks.filter(task => 
      !task.optional && task.title !== "Develop" && task.title !== "Draft"
    );
    const optionalTasks = allTasks.filter(task => task.optional);
    
    let chosen = [...mustHaveTasks]; // Start with must-haves
    let totalTaskMinutes = mustHaveTasks.reduce((sum, task) => sum + task.minutes, 0);
    
    // Add other essential tasks
    for (const task of otherEssentialTasks) {
      chosen.push(task);
      totalTaskMinutes += task.minutes;
    }
    
    // Add optional tasks if we have time
    for (const task of optionalTasks) {
      if (totalTaskMinutes + task.minutes <= totalMinutes) {
        chosen.push(task);
        totalTaskMinutes += task.minutes;
      }
    }
    
    // If we exceed available time, remove optional tasks first
    while (totalTaskMinutes > totalMinutes + 10 && chosen.some(t => t.optional)) {
      const optionalIndex = chosen.findIndex(t => t.optional);
      if (optionalIndex !== -1) {
        const removed = chosen.splice(optionalIndex, 1)[0];
        totalTaskMinutes -= removed.minutes;
      }
    }
    
    // If still exceeding, compress non-must-have essential tasks slightly
    if (totalTaskMinutes > totalMinutes + 10) {
      const compressibleTasks = chosen.filter(t => 
        !t.optional && t.title !== "Develop" && t.title !== "Draft"
      );
      const excess = totalTaskMinutes - (totalMinutes + 10);
      const compressionPerTask = Math.floor(excess / compressibleTasks.length);
      
      compressibleTasks.forEach(task => {
        if (task.minutes > 5) { // Don't compress below 5 minutes
          const reduction = Math.min(compressionPerTask, task.minutes - 5);
          task.minutes -= reduction;
          totalTaskMinutes -= reduction;
        }
      });
    }
    
    // If still exceeding, remove some essential tasks (except must-haves)
    while (totalTaskMinutes > totalMinutes + 10) {
      const removableIndex = chosen.findIndex(t => 
        !t.optional && t.title !== "Develop" && t.title !== "Draft"
      );
      if (removableIndex !== -1) {
        const removed = chosen.splice(removableIndex, 1)[0];
        totalTaskMinutes -= removed.minutes;
      } else {
        break; // Can't remove any more without touching must-haves
      }
    }
    const sessions = times.map((t, idx) => ({
      id: crypto.randomUUID(),
      name: `Session ${idx + 1}`,
      availableMinutes: t,
      activities: [] as LessonPlan["sessions"][number]["activities"]
    }));

    // Distribute activities across sessions round-robin
    chosen.forEach((step, i) => {
      const sessionIndex = i % sessions.length;
      sessions[sessionIndex].activities.push({
        id: crypto.randomUUID(),
        title: step.title,
        minutes: step.minutes,
        optional: !!step.optional,
        styles: step.styles as any,
        handoutUrl: step.handoutUrl
      });
    });
    return {
      id,
      title: `Grade ${fixedGrade}, Unit ${fixedUnit}, Module ${fixedModule} – I'm the Greatest`,
      grade: fixedGrade,
      unit: fixedUnit,
      module: fixedModule,
      sessions,
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
                <p className="text-sm text-muted-foreground">We recommend <span className="font-semibold">90–180 minutes</span> total.</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span>I plan to implement the module in</span>
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
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span>and each session has</span>
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

                <div className="text-sm text-muted-foreground">
                  You have {timesArray.length} sessions, {customTimes ? "custom" : sessionMinutes} minutes each session, total {totalMinutes} minutes
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