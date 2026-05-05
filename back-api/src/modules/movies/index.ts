import { Hono } from 'hono'
import type { AppEnv } from '../../types.js'
import { listMovies, getMovie, getMovieSchedules, getSchedule } from './handlers.js'

const router = new Hono<AppEnv>()

router.get('/movies', listMovies)
router.get('/movies/:movieId', getMovie)
router.get('/movies/:movieId/schedules', getMovieSchedules)
router.get('/schedules/:scheduleId', getSchedule)

export default router
