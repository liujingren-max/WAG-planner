import SparkySheet from "@/components/SparkySheet";
import { Helmet } from "react-helmet-async";

const Index = () => {
  // Load saved plans
  const plans = (() => {
    const raw = localStorage.getItem("plans");
    return raw ? JSON.parse(raw) : [];
  })();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Lesson Planning – I'm the Greatest</title>
        <meta name="description" content="Plan Grade 8 Unit 1 Module 2 – I'm the Greatest." />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>

      <header className="py-14 bg-hero-gradient">
        <div className="container mx-auto text-center space-y-4">
          <h1 className="text-4xl font-bold">Plan "I'm the Greatest" with Sparky</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Create, edit, and organize your lessons. Drag activities, adjust time, and tailor facilitation styles.</p>
          <div className="flex justify-center">
            <SparkySheet />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-10">
        <h2 className="text-xl font-semibold mb-4">Past lesson plans</h2>
        {plans.length === 0 ? (
          <p className="text-muted-foreground">No plans yet. Create your first plan to get started.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p: any) => (
              <li key={p.id} className="rounded-md border p-4">
                <div className="font-medium">{p.title}</div>
                <a href={`/plan/${p.id}`} className="text-sm text-primary underline">Edit</a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Index;
