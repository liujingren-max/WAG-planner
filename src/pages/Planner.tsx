import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Bot, Clock, Plus, Undo2, Redo2, MoreHorizontal, X, Pencil, Presentation, User, Users, ExternalLink, Book, ThumbsUp, Trash2, ChevronDown, Folder, TriangleAlert } from "lucide-react";
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
  const [showTimeWarning, setShowTimeWarning] = useState<boolean>(false);
  const [editingSessionTime, setEditingSessionTime] = useState<string | null>(null);

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
  
  // Check if essential tasks were removed or time is outside recommended range
  const totalMinutes = plan?.sessions.reduce((sum, s) => sum + s.availableMinutes, 0) || 0;
  const isUnderTime = totalMinutes < 125;
  const isOverTime = totalMinutes > 300;
  const shouldShowWarning = isUnderTime || isOverTime;

  // Time options for dropdown (same as SparkySheet conversation)
  const timeOptions = [45, 50, 60, 75, 90, 105, 120, 135, 150, 165, 180];

  useEffect(() => {
    setShowTimeWarning(shouldShowWarning);
  }, [shouldShowWarning]);

  // Auto-recalculate activities function
  function recalculateActivitiesForTime(activities: any[], targetMinutes: number) {
    // This is a simplified version of the planning logic from SparkySheet
    const essentialActivities = activities.filter(a => !a.optional);
    const optionalActivities = activities.filter(a => a.optional);
    
    let currentActivities = [...essentialActivities];
    let currentTime = currentActivities.reduce((sum, a) => sum + a.minutes, 0);
    
    // If we have too much time, add optional activities
    if (currentTime < targetMinutes) {
      for (const optional of optionalActivities) {
        if (currentTime + optional.minutes <= targetMinutes + 5) {
          currentActivities.push(optional);
          currentTime += optional.minutes;
        }
      }
    }
    
    // If we still don't fit, try to adjust times
    const timeDiff = targetMinutes - currentTime;
    if (Math.abs(timeDiff) > 5) {
      // Adjust activity times to fit better
      for (const activity of currentActivities) {
        if (timeDiff > 0 && activity.minutes < 30) {
          const increase = Math.min(timeDiff, 5);
          activity.minutes += increase;
          currentTime += increase;
        } else if (timeDiff < 0 && activity.minutes > 3) {
          const decrease = Math.min(Math.abs(timeDiff), activity.minutes - 2);
          activity.minutes -= decrease;
          currentTime -= decrease;
        }
      }
    }
    
    return currentActivities;
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

      {/* Time Warning Banner */}
      {showTimeWarning && (
        <div className="border-b bg-yellow-50 dark:bg-yellow-950/20">
          <div className="container mx-auto py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                {isUnderTime 
                  ? `Some essential activities may be removed or shortened to fit your time. Current total: ${totalMinutes} min | Recommended minimum: 125 min`
                  : `Your session time may cause pacing fatigue. Current total: ${totalMinutes} min | Recommended maximum: 300 min`
                }
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowTimeWarning(false)}>
              <X className="h-4 w-4" />
            </Button>
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
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Presentation className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Teacher-led</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Individual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
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
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
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
                        // Auto-recalculate plan for this session
                        const session = next.sessions.find(session => session.id === s.id);
                        if (session) {
                          session.activities = recalculateActivitiesForTime(session.activities, newTime);
                        }
                        pushHistory(next);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => {
                if (!plan) return;
                // Remove original plan from localStorage
                const plans = loadPlans().filter(p => p.id !== plan.id);
                savePlans(plans);
                
                // Create new plan with updated session times
                const newPlan = {
                  ...plan,
                  id: crypto.randomUUID(),
                  sessions: plan.sessions.map(s => ({
                    ...s,
                    id: crypto.randomUUID(),
                    activities: recalculateActivitiesForTime(s.activities, s.availableMinutes).map(a => ({
                      ...a,
                      id: crypto.randomUUID()
                    }))
                  }))
                };
                
                // Save new plan
                const updatedPlans = loadPlans();
                updatedPlans.push(newPlan);
                savePlans(updatedPlans);
                
                // Navigate to new plan
                navigate(`/plan/${newPlan.id}`);
                toast({ title: "Regenerated!", description: "New plan created with updated settings." });
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
                               <div className="flex items-center gap-2">
                                 <EditableTitle value={session.name} onChange={(v) => renameSession(session.id, v)} isEditing={editingSessionId === session.id} setEditing={(editing) => setEditingSessionId(editing ? session.id : null)} />
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="h-6 w-6 p-0"
                                   onClick={() => setEditingSessionId(session.id)}
                                 >
                                   <Pencil className="h-3 w-3" />
                                 </Button>
                               </div>
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
                             <CardTitle className="text-sm font-medium text-muted-foreground">
                               Available: 
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="sm" className="h-auto p-0 ml-1 hover:bg-transparent">
                                     <span className={timeClass}>{remaining >= 0 ? `${remaining} min` : `${Math.abs(remaining)} min over`}</span>
                                     <ChevronDown className="h-3 w-3 ml-1" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="start">
                                   {timeOptions.map((time) => (
                                     <DropdownMenuItem
                                       key={time}
                                       onClick={() => {
                                         const next = { ...plan, sessions: plan.sessions.map((x) => x.id === session.id ? { ...x, availableMinutes: time } : x) };
                                         const sessionToUpdate = next.sessions.find(s => s.id === session.id);
                                         if (sessionToUpdate) {
                                           sessionToUpdate.activities = recalculateActivitiesForTime(sessionToUpdate.activities, time);
                                         }
                                         pushHistory(next);
                                       }}
                                     >
                                       {time} min
                                     </DropdownMenuItem>
                                   ))}
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </CardTitle>
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
                                       className="rounded-md border px-4 py-3 bg-card hover:shadow-sm transition group"
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
                                             <div className="flex items-center gap-1">
                                               <Clock className="h-3 w-3 text-muted-foreground" />
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-auto p-0 font-normal">
                                                      {a.minutes} min <ChevronDown className="h-3 w-3 ml-1" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                 <DropdownMenuContent align="start">
                                                   {[3, 5, 7, 10, 12, 15, 20, 25, 30].map((min) => (
                                                     <DropdownMenuItem key={min} onClick={() => changeTime(a.id, session.id, min)} className="text-sm">
                                                       {min} minutes
                                                     </DropdownMenuItem>
                                                   ))}
                                                 </DropdownMenuContent>
                                               </DropdownMenu>
                                             </div>
                                             
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
          <X className="h-4 w-4" />Remove session
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
