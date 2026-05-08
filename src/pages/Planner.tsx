import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Clock, Plus, Undo2, Redo2, MoreHorizontal, X, Pencil, Presentation, User, Users, ExternalLink, Book, Trash2, Folder, ChevronDown } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LessonPlan, SessionColumn, ActivityCard, FacilitationStyle } from "@/state/planTypes";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import TopNav from "@/components/TopNav";
import { toast } from "@/hooks/use-toast";
import { generateLessonPlan } from "@/utils/planningLogic";
import { getModuleData } from "@/utils/activitiesData";

function loadPlan(planId: string): LessonPlan | null {
  const temp = sessionStorage.getItem(`plan-temp-${planId}`);
  return temp ? JSON.parse(temp) : null;
}

function persistPlan(plan: LessonPlan) {
  sessionStorage.setItem(`plan-temp-${plan.id}`, JSON.stringify(plan));
}

export default function Planner() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [history, setHistory] = useState<LessonPlan[]>([]);
  const [future, setFuture] = useState<LessonPlan[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [lastSessionTime, setLastSessionTime] = useState<number>(60);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{ activity: ActivityCard; tab: 'teacher' | 'student' } | null>(null);

  useEffect(() => {
    if (!planId) return;
    const found = loadPlan(planId);
    if (!found) {
      toast({ title: "Plan not found", description: "Returning to home" });
      navigate("/");
      return;
    }
    setPlan(found);
    if (isRegenerating || sessionStorage.getItem('newPlanGenerated') === planId) {
      setJustGenerated(true);
      sessionStorage.removeItem('newPlanGenerated');
      setIsRegenerating(false);
    }
  }, [planId, navigate, isRegenerating]);

  function pushHistory(next: LessonPlan) {
    setHistory(h => [...h, plan!]);
    setFuture([]);
    setPlan(next);
    persistPlan(next);
  }

  const usedMinutesBySession = useMemo(() => {
    if (!plan) return {} as Record<string, number>;
    return Object.fromEntries(
      plan.sessions.map(s => [s.id, s.activities.reduce((sum, a) => sum + a.minutes, 0)])
    );
  }, [plan]);

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

  function handleExportPlan() {
    if (!plan) return;
    const title = plan.readLessonName || plan.title;
    const subtitle = plan.title;
    const sessionsHtml = plan.sessions.map(s => {
      const activitiesHtml = s.activities.map(a =>
        `<div class="activity-row">
          <span class="activity-title">${a.title}</span>
          <span class="activity-time">${a.minutes} min</span>
        </div>`
      ).join('');
      const used = s.activities.reduce((sum, a) => sum + a.minutes, 0);
      return `<div class="session-col">
        <div class="session-header">${s.name}</div>
        ${activitiesHtml}
        <div class="session-total">Total: ${used} min / ${s.availableMinutes} min</div>
      </div>`;
    }).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Montserrat', sans-serif; box-sizing: border-box; }
    body { margin: 24px; color: #4a4a4a; }
    .plan-title { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
    .plan-subtitle { font-size: 13px; color: #707070; margin-bottom: 16px; }
    .sessions-wrap { display: flex; flex-wrap: wrap; gap: 16px; }
    .session-col { border: 1px solid #ccc; border-radius: 8px; padding: 14px; min-width: 200px; flex: 1; page-break-inside: avoid; }
    .session-header { font-size: 14px; font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .activity-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 1px dotted #eee; font-size: 12px; gap: 8px; }
    .activity-title { flex: 1; }
    .activity-time { font-weight: 600; white-space: nowrap; color: #707070; }
    .session-total { font-size: 11px; font-weight: 700; margin-top: 8px; color: #4a4a4a; }
    @media print { @page { size: A4 landscape; margin: 15mm; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="plan-title">${title}</div>
  <div class="plan-subtitle">${subtitle}</div>
  <div class="sessions-wrap">${sessionsHtml}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 400);<\/script>
</body>
</html>`);
    win.document.close();
  }

  function handleExportGuides(type: 'teacher' | 'student') {
    if (!plan) return;
    const allActivities = plan.sessions.flatMap(s => s.activities);
    const urlKey = type === 'teacher' ? 'teacherGuideUrl' : 'studentGuideUrl';
    const seen = new Set<string>();
    const entries: { fileId: string; title: string }[] = [];
    for (const a of allActivities) {
      const url = (a as any)[urlKey] as string | undefined;
      if (url && !seen.has(url)) {
        seen.add(url);
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) entries.push({ fileId: match[1], title: a.title });
      }
    }
    if (entries.length === 0) {
      toast({ title: "No guides available", description: `No ${type} guides found for this plan.` });
      return;
    }

    // Stagger downloads so the browser doesn't block them
    entries.forEach(({ fileId }, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = `https://drive.google.com/uc?export=download&id=${fileId}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, i * 600);
    });

    const label = type === 'teacher' ? 'teacher' : 'student';
    toast({
      title: `Downloading ${entries.length} ${label} guide${entries.length > 1 ? 's' : ''}`,
      description: "Files will download from Google Drive. Make sure pop-ups are allowed.",
    });
  }

  function onDragStart() { setIsDragging(true); }

  function onDragEnd(result: DropResult) {
    setIsDragging(false);
    if (!plan) return;
    const { source, destination } = result;
    if (!destination) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const sourceCol = next.sessions.find(s => s.id === source.droppableId)!;
    const destCol = next.sessions.find(s => s.id === destination.droppableId)!;
    const [moved] = sourceCol.activities.splice(source.index, 1);
    destCol.activities.splice(destination.index, 0, moved);
    pushHistory(next);
  }

  function removeSession(id: string) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const idx = next.sessions.findIndex(s => s.id === id);
    if (idx >= 0) {
      if (next.sessions[idx].activities.length > 0) {
        next.deleted.push(...next.sessions[idx].activities);
      }
      next.sessions.splice(idx, 1);
      pushHistory(next);
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
    const s = next.sessions.find(x => x.id === id);
    if (s) s.name = name;
    pushHistory(next);
  }

  function changeTime(activityId: string, sessionId: string, minutes: number) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const s = next.sessions.find(x => x.id === sessionId)!;
    const a = s.activities.find(y => y.id === activityId)!;
    a.minutes = minutes;
    pushHistory(next);
  }

  function deleteActivity(activityId: string, sessionId: string) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    const s = next.sessions.find(x => x.id === sessionId)!;
    const idx = s.activities.findIndex(a => a.id === activityId);
    if (idx >= 0) {
      const [removed] = s.activities.splice(idx, 1);
      next.deleted.unshift(removed);
      pushHistory(next);
    }
  }

  function restoreActivity(a: ActivityCard) {
    if (!plan) return;
    const next: LessonPlan = JSON.parse(JSON.stringify(plan));
    next.deleted = next.deleted.filter(x => x.id !== a.id);
    next.sessions[0]?.activities.push(a);
    pushHistory(next);
  }

  function undo() {
    if (!history.length || !plan) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setFuture(f => [plan, ...f]);
    setPlan(prev);
    persistPlan(prev);
  }

  function redo() {
    if (!future.length || !plan) return;
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [...h, plan]);
    setPlan(next);
    persistPlan(next);
  }

  const styleIcon = (s: FacilitationStyle) =>
    s === "teacher" ? <Presentation className="h-3.5 w-3.5" /> :
    s === "individual" ? <User className="h-3.5 w-3.5" /> :
    <Users className="h-3.5 w-3.5" />;

  const styleLabel = (s: FacilitationStyle) =>
    s === "teacher" ? "Teacher-led" :
    s === "individual" ? "Individual" :
    "Paired";

  async function regeneratePlan() {
    if (!plan) return;
    setIsRegenerating(true);
    const sessionTimes = plan.sessions.map(s => s.availableMinutes);
    const moduleData = await getModuleData(plan.grade, plan.unit, plan.module);
    const newPlan = generateLessonPlan({
      times: sessionTimes,
      grade: plan.grade,
      unit: plan.unit,
      module: plan.module,
      activities: moduleData?.activities,
      mustHave: moduleData?.mustHaveTaskNames,
      preserveCustomizations: true,
      existingPlan: plan,
      readLessonName: moduleData?.readLessonName,
      coverImageUrl: moduleData?.coverImageUrl,
      directInstructions: moduleData?.directInstructions,
    });
    newPlan.id = crypto.randomUUID();
    sessionStorage.setItem(`plan-temp-${newPlan.id}`, JSON.stringify(newPlan));
    sessionStorage.setItem('newPlanGenerated', newPlan.id);
    navigate(`/plan/${newPlan.id}`);
    toast({ title: "Regenerated!", description: "New plan created with updated settings." });
  }

  if (!plan) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>Module Planner – ThinkCERCA</title>
          <meta name="description" content="Create and edit your module plan." />
          <link rel="canonical" href={window.location.href} />
        </Helmet>

        <TopNav />

        {/* Warning banner */}
        {showWarning && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Some essential activities were removed to fit your time.</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    To take full advantage of the lesson, increase your total session time by at least {150 - totalPlanTime} minutes. Current total: {totalPlanTime} min | Recommended minimum: 150 min
                  </p>
                </div>
              </div>
              <button className="ml-4 p-1 rounded text-yellow-500 hover:bg-yellow-100" onClick={() => setShowWarning(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <main className="px-[50px] py-6">
          {/* Back link */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 mb-3 text-[#1e6fd4] text-[13px] font-medium hover:opacity-80 transition-opacity"
          >
            <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1L1.5 5.5L6 10" stroke="#1e6fd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          {/* Page title row */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[34px] font-bold text-[#4a4a4a] tracking-[-1.02px]">Module Planner</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-10 bg-[#1e6fd4] hover:bg-[#1860ba] text-white font-semibold rounded-[4px] px-5 gap-2">
                  Export <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPlan}>Export Plan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportGuides('teacher')}>Download Teacher Guides</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportGuides('student')}>Download Student Guides</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-end gap-2 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" className="h-10 w-10 bg-[#ebebeb] rounded-[4px]" onClick={undo} disabled={!history.length}>
                  <Undo2 className="h-5 w-5 text-[#4a4a4a]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" className="h-10 w-10 bg-[#ebebeb] rounded-[4px]" onClick={redo} disabled={!future.length}>
                  <Redo2 className="h-5 w-5 text-[#4a4a4a]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
            <Button
              variant="secondary"
              className="h-10 bg-[#ebebeb] hover:bg-[#ddd] text-[#4a4a4a] font-semibold rounded-[4px]"
              onClick={addSession}
            >
              Add Session
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left sidebar */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="border border-[#ccc] rounded-[10px] overflow-hidden">
                {/* Cover image with title overlay */}
                <div className="h-[160px] bg-gradient-to-br from-blue-400 to-blue-600 relative overflow-hidden">
                  {plan.coverImageUrl ? (
                    <img src={plan.coverImageUrl} alt="Module cover" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src="/lovable-uploads/6c91bfd8-0d1b-46e5-9e20-2d012e882b55.png" alt="Module cover" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {/* Solid white overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[72px] flex flex-col justify-center items-center px-[15px]" style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <h2 className="text-[16px] font-bold text-[#4a4a4a] leading-tight truncate w-full text-center">
                      {plan.readLessonName || plan.title}
                    </h2>
                    <p className="text-[11px] text-[#707070] truncate mt-0.5 w-full text-center">{plan.title}</p>
                  </div>
                </div>

                <div className="px-[15px] pb-6">

                  <div className="mt-4 space-y-4 text-[14px]">
                    <div>
                      <p className="font-bold text-[#4a4a4a] mb-1">Learning Objective:</p>
                      <p className="text-[#4a4a4a] leading-[20px]">
                        Students will understand the ways theme is conveyed in a literary text and be able to analyze the theme within a personal narrative, supporting their analysis with evidence from the text.
                      </p>
                    </div>

                    {(plan.directInstructions && plan.directInstructions.length > 0) && (
                      <div>
                        <p className="font-bold text-[#4a4a4a] mb-1">Direct Instruction:</p>
                        <div className="space-y-1">
                          {plan.directInstructions.map((di, i) => (
                            <a key={i}
                              href={di.contentId ? `https://learn.thinkcerca.com/lessons/${di.contentId}?preview=true` : '#'}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[#4a4a4a] hover:underline">
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#707070]" />
                              {di.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-[#4a4a4a] mb-1">Facilitation Style:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><Presentation className="h-4 w-4 text-[#4a4a4a]" /><span className="text-[#4a4a4a]">Teacher-led</span></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#4a4a4a]" /><span className="text-[#4a4a4a]">Paired</span></div>
                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-[#4a4a4a]" /><span className="text-[#4a4a4a]">Individual</span></div>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-[#4a4a4a] mb-1">Resources:</p>
                      <div className="space-y-1">
                        <a href="https://learn.thinkcerca.com/teacher/core_curriculum/grades/8/units/1/modules/3" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#4a4a4a] hover:underline">
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#707070]" />
                          Module Link
                        </a>
                        <a href="https://docs.google.com/presentation/d/1g3UFX1ovp_k9WZ918LDh0fcaO2cMXgjXNZ5nb2s9YQg/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#4a4a4a] hover:underline">
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#707070]" />
                          Student Guide
                        </a>
                      </div>
                    </div>

                    {/* Session times */}
                    <div className="border-t border-dashed border-[#ccc] pt-4">
                      <p className="font-bold text-[#4a4a4a] mb-2">Session Time:</p>
                      {plan.sessions.map((s) => (
                        <div key={s.id} className="group/sessionrow flex items-center gap-2 mb-2">
                          <span className="text-[#4a4a4a] font-bold w-[70px] shrink-0 text-[13px]">{s.name}</span>
                          <div className="border border-[#ccc] rounded-[5px] w-[52px] shrink-0 focus-within:border-[#1e6fd4] focus-within:bg-[#e8f0fb] transition-colors">
                            <Input
                              type="number"
                              min={10}
                              max={240}
                              value={s.availableMinutes}
                              className="h-[28px] border-0 focus-visible:ring-0 text-[13px] px-2 bg-transparent w-full"
                              onChange={e => {
                                const newTime = Number(e.target.value);
                                setLastSessionTime(newTime);
                                const next = { ...plan, sessions: plan.sessions.map(x => x.id === s.id ? { ...x, availableMinutes: newTime } : x) };
                                pushHistory(next);
                              }}
                            />
                          </div>
                          <span className="text-[12px] text-[#707070]">min</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-auto opacity-0 group-hover/sessionrow:opacity-100 transition-opacity shrink-0"
                            onClick={() => {
                              if (s.activities.length === 0) removeSession(s.id);
                              else setConfirmDelete(s.id);
                            }}
                            aria-label="Remove session"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Update & Regenerate */}
                  <div className="mt-6">
                    <Button
                      className="w-full h-10 bg-[#1e6fd4] hover:bg-[#1860ba] text-white font-semibold rounded-[4px]"
                      onClick={regeneratePlan}
                    >
                      Update and Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Board */}
            <section className="col-span-12 lg:col-span-8">
              <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {plan.sessions.map(session => {
                    const used = usedMinutesBySession[session.id] || 0;
                    const over = used > session.availableMinutes;

                    return (
                      <Droppable droppableId={session.id} key={session.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="w-[331px] shrink-0"
                          >
                            <div className={`bg-[#f5f5f5] rounded-[10px] p-5 transition-all ${snapshot.isDraggingOver ? 'ring-2 ring-[#1e6fd4]/30' : ''}`}>
                              {/* Session header */}
                              <div className="flex items-center justify-between mb-4">
                                <EditableTitle
                                  value={session.name}
                                  onChange={v => renameSession(session.id, v)}
                                  isEditing={editingSessionId === session.id}
                                  setEditing={editing => setEditingSessionId(editing ? session.id : null)}
                                />
                                <SessionMenu
                                  onRename={() => setEditingSessionId(session.id)}
                                  onRemove={() => {
                                    if (session.activities.length === 0) removeSession(session.id);
                                    else setConfirmDelete(session.id);
                                  }}
                                  hasActivities={session.activities.length > 0}
                                />
                              </div>

                              {/* Activities */}
                              <div className={`space-y-[10px] min-h-[60px] ${snapshot.isDraggingOver ? 'bg-blue-50/30 rounded-md p-1' : ''}`}>
                                {session.activities.map((a, idx) => (
                                  <Draggable draggableId={a.id} index={idx} key={a.id}>
                                    {(drag, dragSnapshot) => (
                                      <div
                                        ref={drag.innerRef}
                                        {...drag.draggableProps}
                                        {...drag.dragHandleProps}
                                        className={`
                                          bg-white rounded-[5px] shadow-[0px_0px_3px_0px_rgba(0,0,0,0.15)] px-5 py-3 group cursor-grab active:cursor-grabbing
                                          transition-all duration-200
                                          ${dragSnapshot.isDragging ? 'shadow-lg scale-105 ring-2 ring-[#1e6fd4]/30 z-50' : 'hover:shadow-md'}
                                        `}
                                        style={drag.draggableProps.style}
                                      >
                                        {/* Title row */}
                                        <div className="flex items-start justify-between gap-2">
                                          <button
                                            className="text-[16px] font-bold text-[#4a4a4a] leading-normal text-left hover:text-[#1e6fd4] transition-colors flex-1"
                                            onClick={() => setSelectedActivity({ activity: a, tab: 'teacher' })}
                                          >
                                            {a.title}
                                          </button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                                            onClick={() => deleteActivity(a.id, session.id)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>

                                        {/* Bottom row */}
                                        <div className="flex items-center justify-between mt-2">
                                          <div className="flex items-center gap-2">
                                            <TimeBadge
                                              minutes={a.minutes}
                                              originalMinutes={a.originalMinutes}
                                              onChange={newTime => changeTime(a.id, session.id, newTime)}
                                            />
                                            {a.optional && (
                                              <span className="text-[12px] font-medium text-[#4a4a4a] bg-[#f5f5f5] rounded-[10px] px-3 py-0.5">Optional</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {a.styles.map((s, idx) => (
                                              <FacilitationTooltip key={idx} label={styleLabel(s)}>
                                                <div className="w-5 h-5 rounded-sm bg-transparent flex items-center justify-center text-[#4a4a4a]">
                                                  {styleIcon(s)}
                                                </div>
                                              </FacilitationTooltip>
                                            ))}
                                            {a.studentGuide && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => setSelectedActivity({ activity: a, tab: 'student' })}
                                                  >
                                                    <Book className="h-3 w-3 text-[#707070]" />
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Student Guide</TooltipContent>
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

                              {/* Session total */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#ccc]">
                                <span className={`text-[16px] font-bold ${over ? 'text-[#e2231a]' : 'text-[#4a4a4a]'}`}>
                                  Total: {used} min
                                </span>
                                <span className="text-[14px] text-[#4a4a4a]">
                                  Planned Time: {session.availableMinutes} min
                                </span>
                              </div>
                            </div>
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
                  <p className="text-sm font-medium mb-2 text-[#4a4a4a]">Recently deleted</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.deleted.map(a => (
                      <Badge key={a.id} variant="secondary" className="gap-2">
                        {a.title}
                        <Button size="sm" variant="ghost" className="h-4 px-1 text-xs" onClick={() => restoreActivity(a)}>Restore</Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>

        <AlertDialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the entire session and move its activities to Recently deleted. You can restore them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmDelete) removeSession(confirmDelete); setConfirmDelete(null); }}>
                Remove session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ActivityDetailModal
          activity={selectedActivity?.activity || null}
          initialTab={selectedActivity?.tab}
          onClose={() => setSelectedActivity(null)}
          onTimeChange={(activityId, minutes) => {
            if (selectedActivity) {
              changeTime(activityId, plan.sessions.find(s => s.activities.some(a => a.id === activityId))?.id || '', minutes);
            }
          }}
        />
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

  useEffect(() => {
    if (!isEditing) return;
    const handleClick = () => handleSave();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isEditing, val]);

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <Input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          onClick={e => e.stopPropagation()}
          className="font-bold text-[20px] text-[#4a4a4a] h-8 bg-[#e8f0fb] border-[#1e6fd4] focus-visible:ring-0 focus-visible:border-[#1e6fd4]"
        />
      ) : (
        <button onClick={() => setEditing(true)} className="text-[20px] font-bold text-[#4a4a4a] text-left leading-[20px]">
          {value}
        </button>
      )}
    </div>
  );
}

function FacilitationTooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap pointer-events-none z-50 px-[15px] py-1 rounded-[4px] text-[12px] text-white font-medium"
          style={{
            background: 'rgba(74,74,74,0.9)',
            boxShadow: '0 3px 6px rgba(30,38,42,0.1)',
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function SessionMenu({ onRename, onRemove, hasActivities }: { onRename: () => void; onRemove: () => void; hasActivities: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Session actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
        <DropdownMenuItem onClick={onRename} className="gap-2"><Pencil className="h-4 w-4" />Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onRemove} className="gap-2 text-destructive"><Trash2 className="h-4 w-4" />Remove session</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
      <DropdownMenuContent align="start" className="z-50">
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
