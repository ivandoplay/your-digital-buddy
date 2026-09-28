import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "primary" | "info" | "warning" | "destructive" | "success" }) {
  const toneCls = {
    default: "text-foreground",
    primary: "text-primary",
    info: "text-info",
    warning: "text-warning",
    destructive: "text-destructive",
    success: "text-success",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl font-semibold", toneCls)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
  active: { label: "Ativo", cls: "bg-success/15 text-success" },
  inactive: { label: "Inativo", cls: "bg-warning/15 text-warning" },
  archived: { label: "Arquivado", cls: "bg-muted text-muted-foreground line-through" },
  pendente: { label: "Pendente", cls: "bg-warning/15 text-warning" },
  em_analise: { label: "Em análise", cls: "bg-info/15 text-info" },
  regular: { label: "Regular", cls: "bg-success/15 text-success" },
  irregular: { label: "Irregular", cls: "bg-destructive/15 text-destructive" },
  suspenso: { label: "Suspenso", cls: "bg-destructive/15 text-destructive" },
  under_review: { label: "Em revisão", cls: "bg-info/15 text-info" },
  approved: { label: "Aprovado", cls: "bg-success/15 text-success" },
  rejected: { label: "Rejeitado", cls: "bg-destructive/15 text-destructive" },
  admin: { label: "Admin", cls: "bg-primary/15 text-primary" },
  vendedor: { label: "Vendedor", cls: "bg-info/15 text-info" },
  fulfillment: { label: "Fulfillment", cls: "bg-warning/15 text-warning" },
  demo: { label: "DEMO", cls: "bg-warning/20 text-warning" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const denied = /permiss/i.test(message);
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      {denied ? <Lock className="h-7 w-7 text-destructive" /> : <AlertTriangle className="h-7 w-7 text-destructive" />}
      <p className="mt-3 font-medium text-foreground">{denied ? "Permissão negada" : "Não foi possível carregar"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && !denied && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function PendingValue({ value, suffix = "" }: { value: number | null | undefined; suffix?: string }) {
  if (value == null) return <span className="text-warning">CONFIGURAR</span>;
  return <>{value}{suffix}</>;
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
