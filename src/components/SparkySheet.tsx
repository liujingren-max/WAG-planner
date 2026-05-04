import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LessonPlan } from "@/state/planTypes";
import { generateLessonPlan } from "@/utils/planningLogic";
import { getAvailableGrades, getAvailableUnits, getAvailableModules, getModuleData } from "@/utils/activitiesData";

interface SparkySheetProps {
  onCreated?: (plan: LessonPlan) => void;
}

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function SparkySheet({ onCreated }: SparkySheetProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [grade, setGrade] = useState(8);
  const [unit, setUnit] = useState(1);
  const [module, setModule] = useState(2);
  const [availableGrades, setAvailableGrades] = useState<number[]>([]);
  const [availableUnits, setAvailableUnits] = useState<number[]>([]);
  const [availableModules, setAvailableModules] = useState<number[]>([]);

  const [sessionsCount, setSessionsCount] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(50);
  const [customTimes, setCustomTimes] = useState<number[] | null>(null);

  const totalMinutes = useMemo(() => {
    const times = customTimes ?? Array.from({ length: sessionsCount }, () => sessionMinutes);
    return times.reduce((a, b) => a + b, 0);
  }, [customTimes, sessionMinutes, sessionsCount]);

  useEffect(() => {
    if (!open) return;
    setSessionsCount(4);
    setSessionMinutes(50);
    setCustomTimes(null);
    getAvailableGrades().then(grades => {
      setAvailableGrades(grades);
      if (grades.length > 0 && !grades.includes(grade)) {
        setGrade(grades[0]);
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open || availableGrades.length === 0) return;
    getAvailableUnits(grade).then(units => {
      setAvailableUnits(units);
      if (units.length > 0 && !units.includes(unit)) setUnit(units[0]);
    });
  }, [grade, open, availableGrades.length]);

  useEffect(() => {
    if (!open || availableUnits.length === 0) return;
    getAvailableModules(grade, unit).then(modules => {
      setAvailableModules(modules);
      if (modules.length > 0 && !modules.includes(module)) setModule(modules[0]);
    });
  }, [unit, grade, open, availableUnits.length]);
  async function handleGenerate() {
    if (customTimes && customTimes.some(t => t <= 0)) {
      toast({ title: "Invalid session time", description: "Please enter positive minutes for all sessions." });
      return;
    }
    const times = customTimes ?? Array.from({ length: sessionsCount }, () => sessionMinutes);
    const moduleData = await getModuleData(grade, unit, module);
    const plan = generateLessonPlan({
      times,
      grade,
      unit,
      module,
      activities: moduleData?.activities,
      mustHave: moduleData?.mustHaveTaskNames,
    });
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
                  <Select value={String(grade)} onValueChange={v => { setGrade(Number(v)); setUnit(1); setModule(1); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map(g => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={String(unit)} onValueChange={v => { setUnit(Number(v)); setModule(1); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(u => <SelectItem key={u} value={String(u)}>Unit {u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Module</Label>
                  <Select value={String(module)} onValueChange={v => setModule(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModules.map(m => <SelectItem key={m} value={String(m)}>Module {m}</SelectItem>)}
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