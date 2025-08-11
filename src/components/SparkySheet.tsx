import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, User, Users, Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LessonPlan } from "@/state/planTypes";

interface SparkySheetProps {
  onCreated?: (plan: LessonPlan) => void;
}

const fixedGrade = 8;
const fixedUnit = 1;
const fixedModule = 2;

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function SparkySheet({ onCreated }: SparkySheetProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Step state
  const [sessionsCount, setSessionsCount] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [customTimes, setCustomTimes] = useState<number[] | null>(null);

  const [styles, setStyles] = useState({
    teacher: true,
    individual: true,
    collaborative: true,
  });

  const totalMinutes = useMemo(() => {
    const times = customTimes ?? Array.from({ length: sessionsCount }, () => sessionMinutes);
    return times.reduce((a, b) => a + b, 0);
  }, [customTimes, sessionMinutes, sessionsCount]);

  useEffect(() => {
    if (open) {
      // Reset defaults each time opened
      setSessionsCount(3);
      setSessionMinutes(60);
      setCustomTimes(null);
      setStyles({ teacher: true, individual: true, collaborative: true });
    }
  }, [open]);

  const disabledOption = (value: number, fixed: number) => value !== fixed;

  function createPlan(): LessonPlan {
    const times = customTimes ?? Array.from({ length: sessionsCount }, () => sessionMinutes);
    const id = crypto.randomUUID();

    // Generate baseline activities. Use short version if total < 180
    const fullSteps = [
      { title: "Glossary", minutes: 10, optional: true },
      { title: "Connect", minutes: 15 },
      { title: "Read", minutes: 25 },
      { title: "Check", minutes: 10 },
      { title: "Analyze", minutes: 20 },
      { title: "Summarize", minutes: 15 },
      { title: "Develop", minutes: 20 },
      { title: "Draft", minutes: 30 },
      { title: "Review", minutes: 20 },
    ];

    const shortSteps = [
      { title: "Draft", minutes: 40, optional: false },
      { title: "Review", minutes: 30, optional: false },
    ];

    const chosen = totalMinutes < 180 ? shortSteps : fullSteps;

    const chosenStyles = Object.entries(styles)
      .filter(([, v]) => v)
      .map(([k]) => k as keyof typeof styles);

    const sessions = times.map((t, idx) => ({
      id: crypto.randomUUID(),
      name: `Session ${idx + 1}`,
      availableMinutes: t,
      activities: [] as LessonPlan["sessions"][number]["activities"],
    }));

    // Distribute activities across sessions round-robin
    chosen.forEach((step, i) => {
      const sessionIndex = i % sessions.length;
      sessions[sessionIndex].activities.push({
        id: crypto.randomUUID(),
        title: step.title,
        minutes: step.minutes,
        optional: !!step.optional,
        styles: (chosenStyles.length ? chosenStyles : ["teacher", "individual", "collaborative"]) as any,
      });
    });

    return {
      id,
      title: `Grade ${fixedGrade}, Unit ${fixedUnit}, Module ${fixedModule} – I'm the Greatest`,
      grade: fixedGrade,
      unit: fixedUnit,
      module: fixedModule,
      sessions,
      deleted: [],
    } as LessonPlan;
  }

  function handleGenerate() {
    if (customTimes && customTimes.some((t) => t <= 0)) {
      toast({ title: "Invalid session time", description: "Please enter positive minutes for all sessions." });
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

  const timesArray = customTimes ?? Array.from({ length: sessionsCount }, () => sessionMinutes);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg">Create new lesson plan</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[560px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> Sparky
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>I'm ready to help you plan your lesson for</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <div>
                <Label>Grade</Label>
                <Select defaultValue={String(fixedGrade)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {range(6, 12).map((g) => (
                      <SelectItem key={g} value={String(g)} disabled={disabledOption(g, fixedGrade)}>
                        Grade {g}
                      </SelectItem>
                    ))}
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
                    {range(1, 7).map((u) => (
                      <SelectItem key={u} value={String(u)} disabled={disabledOption(u, fixedUnit)}>
                        Unit {u}
                      </SelectItem>
                    ))}
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
                    {range(1, 8).map((m) => (
                      <SelectItem key={m} value={String(m)} disabled={disabledOption(m, fixedModule)}>
                        Module {m}
                      </SelectItem>
                    ))}
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
              <p className="text-sm text-muted-foreground">We recommend 90–180 minutes total.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Number of sessions</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={sessionsCount}
                    onChange={(e) => setSessionsCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                  />
                </div>
                <div>
                  <Label>Minutes per session</Label>
                  <Input
                    type="number"
                    min={10}
                    max={240}
                    value={sessionMinutes}
                    onChange={(e) => setSessionMinutes(Math.max(10, Math.min(240, Number(e.target.value))))}
                    disabled={!!customTimes}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="custom" checked={!!customTimes} onCheckedChange={(v) => setCustomTimes(v ? Array.from({ length: sessionsCount }, () => sessionMinutes) : null)} />
                  <Label htmlFor="custom">Custom session time</Label>
                </div>
                {customTimes && (
                  <div className="grid grid-cols-2 gap-3">
                    {timesArray.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Label className="w-24">Session {i + 1}</Label>
                        <Input
                          type="number"
                          min={10}
                          max={240}
                          value={t}
                          onChange={(e) => {
                            const arr = [...timesArray];
                            arr[i] = Number(e.target.value);
                            setCustomTimes(arr);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    ))}
                    <div className="col-span-2 flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setCustomTimes([...timesArray, sessionMinutes])}
                      >
                        Add session
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setCustomTimes(timesArray.length > 1 ? timesArray.slice(0, -1) : timesArray)}
                      >
                        Remove last
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                You have {timesArray.length} sessions, {customTimes ? "custom" : sessionMinutes} minutes each session, total {totalMinutes} minutes. Coming up with activities to fit your sessions...
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How do you want to facilitate your class?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer select-none">
                <Checkbox checked={styles.teacher} onCheckedChange={(v) => setStyles((s) => ({ ...s, teacher: !!v }))} />
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><div>
                  <div className="text-sm font-medium">Teacher led</div>
                  <div className="text-xs text-muted-foreground">Teacher led presentation</div>
                </div></div>
              </label>
              <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer select-none">
                <Checkbox checked={styles.individual} onCheckedChange={(v) => setStyles((s) => ({ ...s, individual: !!v }))} />
                <div className="flex items-center gap-2"><User className="h-4 w-4" /><div>
                  <div className="text-sm font-medium">Individual</div>
                  <div className="text-xs text-muted-foreground">individual student activity</div>
                </div></div>
              </label>
              <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer select-none">
                <Checkbox checked={styles.collaborative} onCheckedChange={(v) => setStyles((s) => ({ ...s, collaborative: !!v }))} />
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /><div>
                  <div className="text-sm font-medium">Collaborative</div>
                  <div className="text-xs text-muted-foreground">small group activity</div>
                </div></div>
              </label>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleGenerate}>Confirm & Generate lesson plan</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
