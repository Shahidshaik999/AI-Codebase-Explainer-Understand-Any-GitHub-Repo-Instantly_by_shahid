import { useAnalysis } from "../context/AnalysisContext";

export default function SummaryCard() {
  const { state: { analysisData: result } } = useAnalysis();
  if (!result) return null;

  return (
    <div className="space-y-4 stagger">
      <div className="card-hover animate-slide-up">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20
                            flex items-center justify-center text-sm shrink-0">📋</div>
            <h3 className="font-semibold text-white">Summary</h3>
          </div>
          <span className="badge font-mono text-xs shrink-0">{result.repo_name}</span>
        </div>
        <p className="text-white/70 leading-relaxed text-sm">{result.summary}</p>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">{result.total_files_analyzed} files analyzed</span>
          <span className="text-white/20">·</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border
            ${result.explain_mode === "beginner"
              ? "bg-accent-green/10 text-accent-green border-accent-green/20"
              : "bg-accent-blue/10 text-accent-blue border-accent-blue/20"}`}>
            {result.explain_mode} mode
          </span>
        </div>
      </div>

      {result.tech_stack?.length > 0 && (
        <div className="card-hover animate-slide-up">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20
                            flex items-center justify-center text-sm">⚡</div>
            <h3 className="font-semibold text-white">Tech Stack</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.tech_stack.map((tech) => (
              <span key={tech}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08]
                           bg-white/[0.04] text-white/70
                           hover:border-accent-blue/40 hover:text-accent-blue hover:bg-accent-blue/5
                           hover:scale-[1.05] active:scale-[0.97] transition-all duration-200 cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.entry_points?.length > 0 && (
        <div className="card-hover animate-slide-up">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20
                            flex items-center justify-center text-sm">🚀</div>
            <h3 className="font-semibold text-white">Entry Points</h3>
          </div>
          <ul className="space-y-2">
            {result.entry_points.map((ep) => (
              <li key={ep}
                className="flex items-center gap-3 text-sm font-mono text-accent-cyan
                           bg-accent-cyan/5 border border-accent-cyan/15 px-4 py-2.5 rounded-xl
                           hover:border-accent-cyan/30 hover:translate-x-1 transition-all duration-200">
                <span className="text-accent-cyan/40">▶</span>{ep}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.execution_flow && (
        <div className="card-hover animate-slide-up">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-yellow/10 border border-accent-yellow/20
                            flex items-center justify-center text-sm">🔁</div>
            <h3 className="font-semibold text-white">Execution Flow</h3>
          </div>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{result.execution_flow}</p>
        </div>
      )}

      {result.where_to_start && (
        <div className="card border-accent-blue/20 bg-gradient-to-br from-accent-blue/8 to-accent-purple/5
                        animate-slide-up hover:border-accent-blue/35 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">💡</span>
            <div>
              <h3 className="text-sm font-semibold text-accent-blue mb-1.5">Where to Start Reading</h3>
              <p className="text-white/70 text-sm leading-relaxed">{result.where_to_start}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
