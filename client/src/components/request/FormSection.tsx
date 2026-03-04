import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface FormSectionProps {
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
  onClick: () => void;
  children: React.ReactNode;
}

export function FormSection({ title, isCompleted, isActive, progress, onClick, children }: FormSectionProps) {
  return (
    <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isActive ? 'border-primary ring-1 ring-primary/20 bg-card' : 'border-border/50 bg-secondary/10'}`}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? 'border-primary' : 'border-muted-foreground'}`}>
               {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          )}
          <span className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] font-bold text-muted-foreground">{Math.round(progress)}%</span>
             <Progress value={progress} className="w-16 h-1.5" />
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-300">
           <div className="h-px w-full bg-border/50 mb-4" />
           {children}
        </div>
      )}
    </div>
  );
}
