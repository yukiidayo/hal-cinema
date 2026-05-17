import {useMovies} from "~/features/movie/useMovies"
import {DateSelector} from "~/widgets/DateSelector"
import {MovieFilters} from "~/features/movie/components/MovieFilters"
import {MovieGrid} from "~/features/movie/components/MovieGrid"

export default function MoviesPage() {
    const {
        movies,
        loading,
        error,
        days,
        selectedDate,
        selectedStatus,
        view,
        setDate,
        setStatus,
        setView,
        clearAll,
    } = useMovies()

    return (
        <div className="py-8">
            <DateSelector 
                days={days} 
                selectedDate={selectedDate} 
                onSelect={setDate} 
            />

            <MovieFilters 
                selectedStatus={selectedStatus} 
                selectedDate={selectedDate}
                view={view}
                onStatusChange={setStatus} 
                onViewChange={setView}
                onClearAll={clearAll}
            />

            <MovieGrid 
                movies={movies} 
                selectedDate={selectedDate} 
                loading={loading} 
                view={view}
                error={error} 
            />
        </div>
    )
}
