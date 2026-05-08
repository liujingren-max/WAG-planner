import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateLessonPlan } from "@/utils/planningLogic";
import { getAvailableGrades, getAvailableUnits, getAvailableModules, getModuleData } from "@/utils/activitiesData";
import TopNav from "@/components/TopNav";

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function Index() {
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
    setSessionsCount(4);
    setSessionMinutes(50);
    setCustomTimes(null);
    getAvailableGrades().then(grades => {
      setAvailableGrades(grades);
      if (grades.length > 0 && !grades.includes(grade)) {
        setGrade(grades[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (availableGrades.length === 0) return;
    getAvailableUnits(grade).then(units => {
      setAvailableUnits(units);
      if (units.length > 0 && !units.includes(unit)) setUnit(units[0]);
    });
  }, [grade, availableGrades.length]);

  useEffect(() => {
    if (availableUnits.length === 0) return;
    getAvailableModules(grade, unit).then(modules => {
      setAvailableModules(modules);
      if (modules.length > 0 && !modules.includes(module)) setModule(modules[0]);
    });
  }, [unit, grade, availableUnits.length]);

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
      readLessonName: moduleData?.readLessonName,
      coverImageUrl: moduleData?.coverImageUrl,
      directInstructions: moduleData?.directInstructions,
    });
    sessionStorage.setItem(`plan-temp-${plan.id}`, JSON.stringify(plan));
    navigate(`/plan/${plan.id}`);
  }

  const timesArray = customTimes ?? Array.from({ length: sessionsCount }, () => sessionMinutes);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>New Module Plan – ThinkCERCA</title>
        <meta name="description" content="Create a new ThinkCERCA module plan." />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      <TopNav />

      <div className="flex-1 flex justify-center px-6 py-12">
        <div className="w-full max-w-[514px]">
          <h1 className="text-[34px] font-bold text-[#4a4a4a] tracking-[-1.02px] mb-8">
            New Module Plan
          </h1>

          <div className="space-y-5">
            {/* Grade */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#4a4a4a]">Grade</Label>
              <Select value={String(grade)} onValueChange={v => { setGrade(Number(v)); setUnit(1); setModule(1); }}>
                <SelectTrigger className="h-[50px] border-[#ccc] rounded-[5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableGrades.map(g => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#4a4a4a]">Unit</Label>
              <Select value={String(unit)} onValueChange={v => { setUnit(Number(v)); setModule(1); }}>
                <SelectTrigger className="h-[50px] border-[#ccc] rounded-[5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map(u => <SelectItem key={u} value={String(u)}>Unit {u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Module */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#4a4a4a]">Module</Label>
              <Select value={String(module)} onValueChange={v => setModule(Number(v))}>
                <SelectTrigger className="h-[50px] border-[#ccc] rounded-[5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModules.map(m => (
                    <SelectItem key={m} value={String(m)}>
                      {m === 0 ? 'Unit Preview' : `Module ${m}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sessions and Minutes */}
            <p className="text-[20px] font-bold text-[#4a4a4a] pt-2">Sessions and Minutes</p>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#4a4a4a]">Sessions</Label>
              <Select value={String(sessionsCount)} onValueChange={v => setSessionsCount(Number(v))}>
                <SelectTrigger className="h-[50px] border-[#ccc] rounded-[5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {range(1, 10).map(num => <SelectItem key={num} value={String(num)}>{num}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#4a4a4a]">Minutes</Label>
              <Select value={String(sessionMinutes)} onValueChange={v => setSessionMinutes(Number(v))} disabled={!!customTimes}>
                <SelectTrigger className="h-[50px] border-[#ccc] rounded-[5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 25, 30, 35, 40, 45, 50, 60, 80, 90].map(min => <SelectItem key={min} value={String(min)}>{min}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Custom session time */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="custom"
                checked={!!customTimes}
                onCheckedChange={v => setCustomTimes(v ? Array.from({ length: sessionsCount }, () => sessionMinutes) : null)}
              />
              <Label htmlFor="custom" className="text-base font-medium text-[#4a4a4a] cursor-pointer">Custom session time</Label>
            </div>

            {customTimes && (
              <div className="space-y-3">
                {timesArray.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <Label className="w-20 text-sm">Session {i + 1}</Label>
                    <Select value={String(t)} onValueChange={v => {
                      const arr = [...timesArray];
                      arr[i] = Number(v);
                      setCustomTimes(arr);
                    }}>
                      <SelectTrigger className="flex-1 border-[#ccc]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[20, 25, 30, 35, 40, 45, 50, 60, 80, 90].map(min => (
                          <SelectItem key={min} value={String(min)}>{min} minutes</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => {
                      if (timesArray.length > 1) {
                        setCustomTimes(timesArray.filter((_, idx) => idx !== i));
                      }
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={() => setCustomTimes([...timesArray, sessionMinutes])} className="w-full">
                  Add session
                </Button>
              </div>
            )}

            {/* Total time summary */}
            <div className="bg-[#f5f5f5] rounded-[10px] px-6 py-5">
              <p className="text-[20px] font-bold text-[#4a4a4a]">
                Total Time: <span className="font-normal">{totalMinutes} min</span>
              </p>
              <p className="text-sm text-[#4a4a4a] mt-1">(Recommended total time: 150-250 min)</p>
            </div>

            {/* CTA */}
            <Button
              className="w-full h-[50px] bg-[#1e6fd4] hover:bg-[#1860ba] text-white font-semibold rounded-[4px] text-[16px]"
              onClick={handleGenerate}
            >
              Generate Module Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
