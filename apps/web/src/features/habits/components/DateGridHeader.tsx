import { formatDayLabel, formatMonthLabel, isFirstOfMonth } from "@/lib/dates";

type DateGridHeaderProps = {
  dates: string[];
};

export default function DateGridHeader({ dates }: DateGridHeaderProps) {
  return (
    <div className="flex">
      {dates.map((dateStr) => (
        <div
          key={dateStr}
          className="flex w-7 shrink-0 flex-col items-center text-[11px] leading-tight text-muted-foreground"
        >
          {isFirstOfMonth(dateStr) && (
            <span className="text-[9px] uppercase tracking-wide">
              {formatMonthLabel(dateStr)}
            </span>
          )}
          <span className="tabular-nums font-medium">{formatDayLabel(dateStr)}</span>
        </div>
      ))}
    </div>
  );
}
