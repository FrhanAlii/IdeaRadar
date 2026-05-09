import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedIdeas } from "@/hooks/useSupabaseData";
import { IdeaCard } from "@/components/ideas/IdeaCard";

export default function Saved() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: savedRows = [] } = useSavedIdeas(user?.id ?? "");

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Ideas</h1>
        <p className="text-sm text-muted mt-1">Your personal shortlist of ideas worth building.</p>
      </div>

      {savedRows.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center shadow-card">
          <Bookmark className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-2">Nothing saved yet</h3>
          <p className="text-sm text-muted mb-5">Head to Discover and bookmark ideas you like</p>
          <button
            onClick={() => navigate("/discover")}
            className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Discover
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savedRows.map((row: any) => {
            const idea = row.ideas;
            if (!idea) return null;
            return (
              <IdeaCard
                key={row.id}
                {...idea}
                isSaved={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
