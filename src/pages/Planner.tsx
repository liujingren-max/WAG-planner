import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Bot, Clock, Plus, Undo2, Redo2, MoreHorizontal, Trash2, Pencil, BookOpen, User, Users } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { LessonPlan, SessionColumn, ActivityCard, FacilitationStyle } from "@/state/planTypes";
import { toast } from "@/hooks/use-toast";

function loadPlans(): LessonPlan[] {
  const raw = localStorage.getItem("plans");
  return raw ? JSON.parse(raw) : [];
}
function savePlans(plans: LessonPlan[]) {
  localStorage.setItem("plans", JSON.stringify(plans));
}

export default function Planner() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [history, setHistory] = useState<LessonPlan[]>([]);
  const [future, setFuture] = useState<LessonPlan[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // session id

  useEffect(() => {
    const list = loadPlans();
    const found = list.find((p) => p.id === planId) || null;
    if (!found) {
      toast({ title: "Plan not found", description: "Returning to home" });
      navigate("/");
      return;
    }
    setPlan(found);
  }, [planId, navigate]);

  function pushHistory(next: LessonPlan) {
    setHistory((h) => [...h, plan!]);
    setFuture([]);
    setPlan(next);
    // persist
    const list = loadPlans().map((p) => (p.id === next.id ? next : p));
    savePlans(list);
  }

  const usedMinutesBySession = useMemo(() => {
    if (!plan) return {} as Record<string, number>;
    return Object.fromEntries(
      plan.sessions.map((s) => [s.id, s.activities.reduce((sum, a) => sum + a.minutes, 0)])
    );
  }, [plan]);

  function onDragEnd(result: DropResult) {
    if (!plan) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const sourceCol = next.sessions.find((s) => s.id === source.droppableId)!;
    const destCol = next.sessions.find((s) => s.id === destination.droppableId)!;

    const [moved] = sourceCol.activities.splice(source.index, 1);
    destCol.activities.splice(destination.index, 0, moved);

    pushHistory(next);
  }

  function removeSession(id: string) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const idx = next.sessions.findIndex((s) => s.id === id);
    if (idx >= 0) {
      // move activities to recently deleted
      next.deleted.push(...next.sessions[idx].activities);
      next.sessions.splice(idx, 1);
      pushHistory(next);
    }
  }

  function addSession() {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    next.sessions.push({ id: crypto.randomUUID(), name: `Session ${next.sessions.length + 1}`, availableMinutes: 60, activities: [] });
    pushHistory(next);
  }

  function renameSession(id: string, name: string) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const s = next.sessions.find((x) => x.id === id);
    if (s) s.name = name;
    pushHistory(next);
  }

  function changeTime(activityId: string, sessionId: string, minutes: number) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const s = next.sessions.find((x) => x.id === sessionId)!;
    const a = s.activities.find((y) => y.id === activityId)!;
    a.minutes = minutes;
    pushHistory(next);
  }

  function deleteActivity(activityId: string, sessionId: string) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const s = next.sessions.find((x) => x.id === sessionId)!;
    const idx = s.activities.findIndex((a) => a.id === activityId);
    if (idx >= 0) {
      const [removed] = s.activities.splice(idx, 1);
      next.deleted.unshift(removed);
      pushHistory(next);
    }
  }

  function restoreActivity(a: ActivityCard) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    next.deleted = next.deleted.filter((x) => x.id !== a.id);
    // put into first session by default
    next.sessions[0]?.activities.push(a);
    pushHistory(next);
  }

  function undo() {
    if (!history.length || !plan) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [plan, ...f]);
    setPlan(prev);
    const list = loadPlans().map((p) => (p.id === prev.id ? prev : p));
    savePlans(list);
  }
  function redo() {
    if (!future.length || !plan) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, plan]);
    setPlan(next);
    const list = loadPlans().map((p) => (p.id === next.id ? next : p));
    savePlans(list);
  }

  const styleIcon = (s: FacilitationStyle) => s === "teacher" ? <BookOpen className="h-3.5 w-3.5" /> : s === "individual" ? <User className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />;

  if (!plan) return null;

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Lesson Planner – I'm the Greatest</title>
        <meta name="description" content="Create and edit your lesson plan for I'm the Greatest." />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Bot className="h-4 w-4" /> Sparky Planner</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={undo} disabled={!history.length}><Undo2 className="h-4 w-4 mr-2" />Undo</Button>
            <Button variant="secondary" onClick={redo} disabled={!future.length}><Redo2 className="h-4 w-4 mr-2" />Redo</Button>
            <Button onClick={() => navigate("/")}>Home</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 grid grid-cols-12 gap-4">
        {/* Left settings panel */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Session minutes</div>
                {plan.sessions.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-sm w-20">{s.name}</span>
                    <Input
                      type="number"
                      min={10}
                      max={240}
                      value={s.availableMinutes}
                      onChange={(e) => {
                        const next = { ...plan, sessions: plan.sessions.map((x) => x.id === s.id ? { ...x, availableMinutes: Number(e.target.value) } : x) };
                        pushHistory(next);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Facilitation style</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1"><BookOpen className="h-3.5 w-3.5" />Teacher led</Badge>
                  <Badge variant="secondary" className="gap-1"><User className="h-3.5 w-3.5" />Individual</Badge>
                  <Badge variant="secondary" className="gap-1"><Users className="h-3.5 w-3.5" />Collaborative</Badge>
                </div>
              </div>
              <Button onClick={() => toast({ title: "Regenerated!", description: "Updated settings applied to your plan." })}>Update & Regenerate</Button>
            </CardContent>
          </Card>
        </aside>

        {/* Board */}
        <section className="col-span-12 md:col-span-9">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{plan.title}</h1>
            <Button variant="secondary" onClick={addSession}><Plus className="h-4 w-4 mr-2" />Add session</Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {plan.sessions.map((session) => {
                const used = usedMinutesBySession[session.id] || 0;
                const remaining = session.availableMinutes - used;
                const timeClass = remaining < 0 ? "text-destructive" : remaining >= 10 ? "text-[hsl(var(--warning))]" : "text-muted-foreground";

                return (
                  <Droppable droppableId={session.id} key={session.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="w-80 shrink-0">
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <EditableTitle value={session.name} onChange={(v) => renameSession(session.id, v)} />
                              <SessionMenu onRename={() => {}} onRemove={() => setConfirmDelete(session.id)} />
                            </div>
                            <div className="text-xs text-muted-foreground">Available: {session.availableMinutes} min</div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {session.activities.map((a, idx) => (
                                <Draggable draggableId={a.id} index={idx} key={a.id}>
                                  {(drag) => (
                                    <div
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      {...drag.dragHandleProps}
                                      className="rounded-md border p-3 bg-card hover:shadow-sm transition"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="font-medium text-sm">{a.title}</div>
                                        <Button variant="ghost" size="icon" onClick={() => deleteActivity(a.id, session.id)} aria-label="Delete activity">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                                        <TimeBadge minutes={a.minutes} onChange={(m) => changeTime(a.id, session.id, m)} />
                                        {a.optional && <Badge variant="secondary">Optional</Badge>}
                                        {a.styles.length <= 1 ? (
                                          a.styles.map((s) => (
                                            <Badge key={s} variant="outline" className="gap-1">
                                              {styleIcon(s)} <span className="capitalize">{s}</span>
                                            </Badge>
                                          ))
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            {a.styles.map((s) => (
                                              <Badge key={s} variant="outline" className="p-1">{styleIcon(s)}</Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                            <div className={`mt-3 text-xs ${timeClass}`}>Total: {used} min</div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>

          {/* Recently deleted */}
          {!!plan.deleted.length && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Recently deleted</div>
              <div className="flex flex-wrap gap-2">
                {plan.deleted.map((a) => (
                  <Badge key={a.id} variant="secondary" className="gap-2">
                    {a.title}
                    <Button size="sm" variant="ghost" onClick={() => restoreActivity(a)}>Restore</Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the entire session and move its activities to Recently deleted. You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDelete) removeSession(confirmDelete); setConfirmDelete(null); }}>Remove session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditableTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <Input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => { setEditing(false); if (val.trim()) onChange(val.trim()); }} />
      ) : (
        <button onClick={() => setEditing(true)} className="text-left font-semibold">
          {value}
        </button>
      )}
    </div>
  );
}

function SessionMenu({ onRename, onRemove }: { onRename: () => void; onRemove: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Session actions"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
        <DropdownMenuItem onClick={onRename} className="gap-2"><Pencil className="h-4 w-4" />Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onRemove} className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Remove session</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TimeBadge({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  const options = [1, 2, 3, 5, 10, 15, 20, 25, 30];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge variant="outline" className="cursor-pointer select-none gap-1"><Clock className="h-3.5 w-3.5" />{minutes} min</Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((o) => (
          <DropdownMenuItem key={o} onClick={() => onChange(o)}>{o} min</DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => {
          const m = Number(prompt("Enter minutes"));
          if (!Number.isNaN(m) && m > 0) onChange(m);
        }}>Other…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
