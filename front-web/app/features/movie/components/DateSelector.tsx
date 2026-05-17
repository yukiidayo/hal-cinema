

export type DayInfo = {
  iso: string;
  label: string;
};

type Props = {
  days: DayInfo[];
  selectedDate: string;
  onSelect: (iso: string) => void;
};

export function DateSelector({ days, selectedDate, onSelect }: Props) {
  return (
    <div className="mb-8 flex gap-3 overflow-x-auto pb-4 no-scrollbar">
      {days.map((day, index) => {
        const labelText = index === 0 ? "今日" : index === 1 ? "明日" : "";
        const dateObj = new Date(day.iso);
        const dayNum = dateObj.getDate();
        const weekDay = dateObj.toLocaleDateString("ja-JP", { weekday: "short" });
        const isActive = selectedDate === day.iso;

        return (
          <button
            key={day.iso}
            onClick={() => onSelect(day.iso)}
            className={`flex w-full flex-col items-center rounded-lg py-3 transition-all ${
              isActive
                ? "bg-muted border border-primary shadow-lg shadow-primary/10"
                : "bg-muted/40 hover:bg-muted"
            }`}
          >
            <span className="text-[10px] font-bold text-muted-foreground">{labelText || "\u00A0"}</span>
            <span className={`text-xl font-black ${isActive ? "text-primary" : "text-foreground"}`}>
              {dayNum}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">({weekDay})</span>
          </button>
        );
      })}
    </div>
  );
}
