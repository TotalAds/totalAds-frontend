import {
  REPUTATION_STYLES,
  SENDER_CATEGORY_STYLES,
  type DomainAuthRecord,
  type SenderCategoryInfo,
  type SenderReputationBadge,
} from "@/lib/senderTrustTypes";

function authMark(ok: boolean | null): string {
  if (ok === null) return "—";
  return ok ? "✅" : "❌";
}

export function SenderCategoryBadge({
  category,
  compact = false,
}: {
  category?: SenderCategoryInfo | null;
  compact?: boolean;
}) {
  if (!category) return null;
  const styles = SENDER_CATEGORY_STYLES[category.category];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${styles.bg} ${styles.text} ${styles.border} ${
        compact ? "text-[10px]" : "text-[11px]"
      }`}
      title={category.subtitle}
    >
      <span>{category.badge}</span>
      <span className="opacity-70">·</span>
      <span>{category.dailyLimitLabel}</span>
    </span>
  );
}

export function SenderReputationBadge({
  reputation,
  compact = false,
}: {
  reputation?: SenderReputationBadge | null;
  compact?: boolean;
}) {
  if (!reputation) return null;
  const styles = REPUTATION_STYLES[reputation.level];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${styles.bg} ${styles.text} ${
        compact ? "text-[10px]" : "text-[11px]"
      }`}
      title="Based on account age, send volume, bounce rate, and warmup progress"
    >
      <span aria-hidden>{reputation.emoji}</span>
      <span>{reputation.label} sender reputation</span>
    </span>
  );
}

export function DomainAuthRow({
  domainAuth,
  compact = false,
  onSetupClick,
}: {
  domainAuth?: DomainAuthRecord | null;
  compact?: boolean;
  onSetupClick?: () => void;
}) {
  if (!domainAuth) return null;

  if (!domainAuth.applicable) {
    return (
      <p className={`text-text-300 leading-snug ${compact ? "text-[10px]" : "text-[11px]"}`}>
        {domainAuth.note ?? "Authentication managed by your mail provider"}
      </p>
    );
  }

  const allOk = domainAuth.spf && domainAuth.dkim && domainAuth.dmarc;
  const labelClass = compact ? "text-[10px]" : "text-[11px]";
  const needsSetup = !allOk;

  return (
    <div className={`space-y-1 ${labelClass}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="font-medium text-text-200">Domain auth</span>
        <span className={domainAuth.spf ? "text-emerald-700" : "text-rose-700"}>
          SPF {authMark(domainAuth.spf)}
        </span>
        <span className={domainAuth.dkim ? "text-emerald-700" : "text-rose-700"}>
          DKIM {authMark(domainAuth.dkim)}
        </span>
        <span className={domainAuth.dmarc ? "text-emerald-700" : "text-rose-700"}>
          DMARC {authMark(domainAuth.dmarc)}
        </span>
      </div>
      {needsSetup && onSetupClick && (
        <button
          type="button"
          onClick={onSetupClick}
          className="text-[11px] font-semibold text-brand-main hover:underline"
        >
          Set up DNS (step-by-step) →
        </button>
      )}
      {!allOk && domainAuth.note && (
        <span className="text-text-300 block">{domainAuth.note}</span>
      )}
    </div>
  );
}

export function SenderTrustIndicators({
  senderCategory,
  reputation,
  domainAuth,
  compact = false,
  showDomainAuth = true,
  onDomainAuthSetupClick,
}: {
  senderCategory?: SenderCategoryInfo | null;
  reputation?: SenderReputationBadge | null;
  domainAuth?: DomainAuthRecord | null;
  compact?: boolean;
  showDomainAuth?: boolean;
  onDomainAuthSetupClick?: () => void;
}) {
  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
      <div className="flex flex-wrap gap-1.5">
        <SenderCategoryBadge category={senderCategory} compact={compact} />
        <SenderReputationBadge reputation={reputation} compact={compact} />
      </div>
      {showDomainAuth && (
        <DomainAuthRow
          domainAuth={domainAuth}
          compact={compact}
          onSetupClick={onDomainAuthSetupClick}
        />
      )}
    </div>
  );
}
