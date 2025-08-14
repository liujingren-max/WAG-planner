import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Bot, Clock, Plus, Undo2, Redo2, MoreHorizontal, X, Pencil, Presentation, User, Users, ExternalLink, Book, ThumbsUp, Trash2, Folder } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LessonPlan, SessionColumn, ActivityCard, FacilitationStyle } from "@/state/planTypes";
import { toast } from "@/hooks/use-toast";
import { generateLessonPlan } from "@/utils/planningLogic";

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
  const [lastSessionTime, setLastSessionTime] = useState<number>(60);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const list = loadPlans();
    const found = list.find((p) => p.id === planId) || null;
    if (!found) {
      toast({ title: "Plan not found", description: "Returning to home" });
      navigate("/");
      return;
    }
    setPlan(found);
    // Only mark as generated if we're coming from regeneration or it's a new plan
    if (isRegenerating || sessionStorage.getItem('newPlanGenerated') === planId) {
      setJustGenerated(true);
      sessionStorage.removeItem('newPlanGenerated');
      setIsRegenerating(false);
    }
  }, [planId, navigate, isRegenerating]);

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

  // Check if warning should be shown
  const totalPlanTime = useMemo(() => {
    if (!plan) return 0;
    return plan.sessions.reduce((sum, s) => sum + s.availableMinutes, 0);
  }, [plan]);

  useEffect(() => {
    if (plan && totalPlanTime < 125 && justGenerated) {
      setShowWarning(true);
      setJustGenerated(false);
    }
  }, [plan, totalPlanTime, justGenerated]);

  function onDragStart() {
    setIsDragging(true);
  }

  function onDragEnd(result: DropResult) {
    setIsDragging(false);
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
    const session = next.sessions.find((s) => s.id === id);
    const idx = next.sessions.findIndex((s) => s.id === id);
    if (idx >= 0) {
      // If session is empty, no confirm modal needed
      if (session?.activities.length === 0) {
        next.sessions.splice(idx, 1);
        pushHistory(next);
      } else {
        // move activities to recently deleted
        next.deleted.push(...next.sessions[idx].activities);
        next.sessions.splice(idx, 1);
        pushHistory(next);
      }
    }
  }

  function addSession() {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const newSessionTime = plan.sessions.length > 0 ? plan.sessions[plan.sessions.length - 1].availableMinutes : lastSessionTime;
    next.sessions.push({ id: crypto.randomUUID(), name: `Session ${next.sessions.length + 1}`, availableMinutes: newSessionTime, activities: [] });
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
    // Preserve originalMinutes - don't change it when user manually adjusts time
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

  const styleIcon = (s: FacilitationStyle) => s === "teacher" ? <Presentation className="h-3.5 w-3.5" /> : s === "individual" ? <User className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />;

  // Use the same sophisticated planning logic for regeneration
  function regeneratePlan() {
    if (!plan) return;
    
    setIsRegenerating(true);
    
    // Remove original plan from localStorage
    const plans = loadPlans().filter(p => p.id !== plan.id);
    savePlans(plans);
    
    // Get current session times
    const sessionTimes = plan.sessions.map(s => s.availableMinutes);
    
    // Generate new plan using the same sophisticated algorithm as initial creation
    const newPlan = generateLessonPlan({
      times: sessionTimes,
      grade: plan.grade,
      unit: plan.unit,
      module: plan.module,
      preserveCustomizations: true,
      existingPlan: plan
    });
    
    // Assign new ID for regenerated plan
    newPlan.id = crypto.randomUUID();
    
    // Save new plan
    const updatedPlans = loadPlans();
    updatedPlans.push(newPlan);
    savePlans(updatedPlans);
    
    // Mark that this is a regenerated plan
    sessionStorage.setItem('newPlanGenerated', newPlan.id);
    
    // Navigate to new plan
    navigate(`/plan/${newPlan.id}`);
    toast({ title: "Regenerated!", description: "New plan created with updated settings using the same intelligent algorithm." });
  }

  if (!plan) return null;

  return (
    <TooltipProvider>
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

      {/* Warning banner */}
      {showWarning && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 mx-4">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Some essential activities were removed to fit your time.
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    To take full advantage of the lesson, increase your total session time by at least {150 - totalPlanTime} minutes.
                  </p>
                  <p className="mt-1">
                    Current total: {totalPlanTime} min | Recommended minimum: 150 min
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  onClick={() => setShowWarning(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto py-6 grid grid-cols-12 gap-4">
        {/* Left settings panel */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/lovable-uploads/6c91bfd8-0d1b-46e5-9e20-2d012e882b55.png" 
                    alt="I'm the Greatest lesson cover"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base">I'm the Greatest</h2>
                  <p className="text-sm text-muted-foreground">by James Bird (Personal Narrative)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open('https://learn.thinkcerca.com/lessons/206146?preview=true', '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Preview Lesson
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-sm font-semibold mb-1">Learning Objective:</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Students will understand the ways theme is conveyed in a literary text and be able to analyze the theme within a personal narrative, supporting their analysis with evidence from the text.
                  </p>
                </div>
                
                <div>
                  <div className="text-sm font-semibold mb-2">Facilitation Style:</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                        <Presentation className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Teacher-led</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Individual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Paired or Small Group</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-semibold mb-1">Direct Instruction:</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Determining Theme and Author's Message in a Personal Narrative</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => window.open('https://learn.thinkcerca.com/lessons/82431?preview=true', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Organizing Narrative Writing</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => window.open('https://learn.thinkcerca.com/lessons/176389?preview=true', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-semibold mb-2">Resources:</div>
                  <div className="space-y-2">
                    <a 
                      href="https://learn.thinkcerca.com/teacher/core_curriculum/grades/8/units/1/modules/3" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Folder className="h-3.5 w-3.5" />
                      Module Link
                    </a>
                    <a 
                      href="https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/edit?slide=id.g29c977eb948_0_0#slide=id.g29c977eb948_0_0" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Book className="h-3.5 w-3.5 text-muted-foreground" />
                      Student Guide
                    </a>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Session Time</div>
                {plan.sessions.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="text-sm w-[70px] truncate">{s.name}</span>
                    <Input
                      type="number"
                      min={10}
                      max={240}
                      value={s.availableMinutes}
                      className="w-16"
                      onChange={(e) => {
                        const newTime = Number(e.target.value);
                        setLastSessionTime(newTime);
                        const next = { ...plan, sessions: plan.sessions.map((x) => x.id === s.id ? { ...x, availableMinutes: newTime } : x) };
                        pushHistory(next);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => {
                regeneratePlan();
              }}>Update & Regenerate</Button>
            </CardContent>
          </Card>
        </aside>

        {/* Board */}
        <section className="col-span-12 md:col-span-9">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{plan.title}</h1>
            <Button variant="secondary" onClick={addSession}><Plus className="h-4 w-4 mr-2" />Add session</Button>
          </div>

          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {plan.sessions.map((session) => {
                const used = usedMinutesBySession[session.id] || 0;
                const remaining = session.availableMinutes - used;
                const timeClass = remaining < 0 ? "text-destructive" : remaining >= 10 ? "text-[hsl(var(--warning))]" : "text-muted-foreground";

                return (
                  <Droppable droppableId={session.id} key={session.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps} 
                        className="w-80 shrink-0"
                      >
                        <Card className={`transition-all duration-200 ${snapshot.isDraggingOver ? 'ring-2 ring-primary/20 bg-accent/50' : ''}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <EditableTitle value={session.name} onChange={(v) => renameSession(session.id, v)} isEditing={editingSessionId === session.id} setEditing={(editing) => setEditingSessionId(editing ? session.id : null)} />
                              <SessionMenu 
                                onRename={() => setEditingSessionId(session.id)} 
                                onRemove={() => {
                                  if (session.activities.length === 0) {
                                    removeSession(session.id);
                                  } else {
                                    setConfirmDelete(session.id);
                                  }
                                }}
                                hasActivities={session.activities.length > 0}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">Available: {session.availableMinutes} min</div>
                          </CardHeader>
                          <CardContent>
                            <div 
                              className={`space-y-2 min-h-[60px] transition-all duration-200 ${
                                snapshot.isDraggingOver ? 'bg-accent/30 rounded-md p-2' : ''
                              }`}
                            >
                              {session.activities.map((a, idx) => (
                                <Draggable draggableId={a.id} index={idx} key={a.id}>
                                  {(drag, dragSnapshot) => (
                                    <div
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      {...drag.dragHandleProps}
                                      className={`
                                        rounded-md border px-4 py-3 bg-card group cursor-grab active:cursor-grabbing
                                        transition-all duration-200 ease-out
                                        ${dragSnapshot.isDragging 
                                          ? 'shadow-lg scale-105 rotate-2 bg-card z-50 ring-2 ring-primary/30' 
                                          : 'hover:shadow-sm hover:bg-accent/30'
                                        }
                                        ${!isDragging ? 'hover:shadow-sm' : ''}
                                      `}
                                      style={{
                                        ...drag.draggableProps.style,
                                        transform: dragSnapshot.isDragging 
                                          ? `${drag.draggableProps.style?.transform} rotate(2deg)`
                                          : drag.draggableProps.style?.transform
                                      }}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-start justify-between">
                                          <h4 className="text-sm font-semibold leading-tight text-left">{a.title}</h4>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all"
                                            onClick={() => deleteActivity(a.id, session.id)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        
                                        {a.optional && (
                                          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-normal bg-neutral-100 text-muted-foreground">
                                            Optional
                                          </Badge>
                                        )}
                                        
                                        <div className="flex items-center justify-between pt-1">
                                          <div className="flex items-center gap-3">
                            <TimeBadge 
                              minutes={a.minutes} 
                              originalMinutes={a.originalMinutes}
                              onChange={(newTime) => changeTime(a.id, session.id, newTime)}
                            />
                                            
                                            <div className="flex items-center gap-1">
                                              <div className="flex -space-x-0.5">
                                                {a.styles.map((s, idx) => (
                                                  <div key={idx} className="w-5 h-5 rounded-sm bg-muted border border-background flex items-center justify-center">
                                                    {styleIcon(s)}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                           </div>
                                           
                                           {a.handoutUrl && (
                                             <Tooltip>
                                               <TooltipTrigger asChild>
                                                 <Button
                                                   variant="ghost"
                                                   size="sm"
                                                   className="h-6 w-6 p-0"
                                                   onClick={() => window.open(a.handoutUrl, '_blank')}
                                                 >
                                                   <Book className="h-3 w-3 text-muted-foreground" />
                                                 </Button>
                                               </TooltipTrigger>
                                               <TooltipContent>
                                                 <p>Student Guide Available</p>
                                               </TooltipContent>
                                             </Tooltip>
                                           )}
                                         </div>
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
    </TooltipProvider>
  );
}

function EditableTitle({ value, onChange, isEditing, setEditing }: { value: string; onChange: (v: string) => void; isEditing: boolean; setEditing: (editing: boolean) => void }) {
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  const handleSave = () => {
    setEditing(false);
    if (val.trim()) onChange(val.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (isEditing) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isEditing, val]);

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <Input 
          autoFocus 
          value={val} 
          onChange={(e) => setVal(e.target.value)} 
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button onClick={() => setEditing(true)} className="text-left font-semibold">
          {value}
        </button>
      )}
    </div>
  );
}

function SessionMenu({ onRename, onRemove, hasActivities }: { onRename: () => void; onRemove: () => void; hasActivities: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Session actions"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
        <DropdownMenuItem onClick={onRename} className="gap-2"><Pencil className="h-4 w-4" />Rename</DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            if (!hasActivities) {
              onRemove();
            } else {
              // Will trigger confirm dialog
              onRemove();
            }
          }} 
          className="gap-2 text-destructive"
        >
          <Trash2 className="h-4 w-4" />Remove session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
