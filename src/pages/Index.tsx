import { useState } from "react";
import { Helmet } from "react-helmet-async";
import TopNav from "@/components/TopNav";
import SparkySheet from "@/components/SparkySheet";
import { LessonPlan } from "@/state/planTypes";

function loadSavedPlans(): LessonPlan[] {
  const raw = localStorage.getItem("plans");
  const all: LessonPlan[] = raw ? JSON.parse(raw) : [];
  // Only show plans that have been explicitly saved to library
  return all
    .filter(p => p.savedAt !== undefined)
    .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}


export default function Index() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const plans = loadSavedPlans();

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Module Plan – ThinkCERCA</title>
        <meta name="description" content="Create and manage your ThinkCERCA module plans." />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      <TopNav />

      {/* Hero */}
      <div className="relative h-[300px] overflow-hidden">
        <img src="/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-[56px] font-bold text-white tracking-[-1.12px] leading-none">
            Module Plan
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-12 py-8">
        {/* Cards grid */}
        <div className="flex flex-wrap gap-6">
          {/* Add new plan card */}
          <button
            onClick={() => setSheetOpen(true)}
            className="w-[300px] h-[320px] border-2 border-dashed border-[#d5d7db] rounded-[15px] flex items-center justify-center text-[#707070] hover:border-[#9b9b9b] hover:text-[#4a4a4a] transition-colors"
            aria-label="Add new module plan"
          >
            <span className="text-[100px] leading-none font-light">+</span>
          </button>

          {/* Saved plan cards */}
          {plans.map((plan) => (
            <a
              key={plan.id}
              href={`/plan/${plan.id}`}
              className="w-[300px] h-[320px] bg-white border border-[#ccc] rounded-[10px] overflow-hidden flex flex-col hover:shadow-md transition-shadow no-underline"
            >
              {/* Cover image area */}
              <div className="h-[160px] flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600">
                {plan.coverImageUrl && (
                  <img src={plan.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>

              {/* Card body */}
              <div className="flex flex-col flex-1 px-[15px] pt-3 pb-[18px]">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <rect x="1" y="1" width="16" height="16" rx="2" stroke="#1E6FD4" strokeWidth="1.5" fill="none" />
                    <path d="M5 7h8M5 10h5" stroke="#1E6FD4" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] font-semibold text-[#707070] tracking-[1px] uppercase">
                    Lesson Plan
                  </span>
                </div>

                <h2 className="text-[18px] font-bold text-[#4a4a4a] leading-[1.3] line-clamp-3 flex-1">
                  {plan.readLessonName || plan.title}
                </h2>

                <p className="text-[10px] font-semibold text-[#707070] uppercase tracking-wide mt-auto">
                  Grade {plan.grade} Unit {plan.unit} Module {plan.module}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <SparkySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
