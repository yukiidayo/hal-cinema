import {useMovies} from "~/features/movie/useMovies"
import {DateSelector} from "~/features/movie/components/DateSelector"
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
        setDate,
        setStatus,
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
                onStatusChange={setStatus} 
                onClearAll={clearAll}
            />

            <MovieGrid 
                movies={movies} 
                selectedDate={selectedDate} 
                loading={loading} 
                error={error} 
            />
        </div>
    )
}
