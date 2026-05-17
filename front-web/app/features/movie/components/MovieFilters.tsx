type Props = {
    selectedStatus: string;
    selectedDate: string;
    view: "grid" | "list";
    onStatusChange: (status: string) => void;
    onViewChange: (v: "grid" | "list") => void;
    onClearAll: () => void;
    // 他のフィルタ（検索など）も将来的にここに追加
};

export function MovieFilters({selectedStatus, selectedDate, view, onStatusChange, onViewChange, onClearAll}: Props) {
    return (
        <div className="mb-8 flex items-center gap-4 rounded-xl bg-muted/60 p-4 border border-border">
            <button
                onClick={onClearAll}
                className={`rounded-md border border-border px-6 py-2 text-sm font-bold transition ${
                    selectedStatus === "" && selectedDate === ""
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-foreground hover:bg-muted"
                }`}
            >
                すべて
            </button>

            <div className="flex-1"/>

            <div className="relative flex items-center">
                <div
                    className="flex items-center rounded-lg border border-border bg-background px-4 py-2 w-64 focus-within:ring-1 focus-within:ring-primary transition-all">
                    <svg className="mr-2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor"
                         viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="検索"
                        className="bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-background p-1 border border-border">
                <button
                    onClick={() => onViewChange("grid")}
                    className={`rounded-md p-1.5 transition ${
                        view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>
                    </svg>
                </button>
                <button
                    onClick={() => onViewChange("list")}
                    className={`rounded-md p-1.5 transition ${
                        view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M3 12h18M3 6h18M3 18h18"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}
