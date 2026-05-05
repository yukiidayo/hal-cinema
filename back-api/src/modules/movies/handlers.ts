import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import * as MovieService from '#modules/movies/service.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const listMovies = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const date = c.req.query('date')
  const status = c.req.query('status')

  if (date && !DATE_RE.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
  if (status && !['now_showing', 'coming_soon'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid status value')
  }

  const movieRows = await MovieService.getMovies(status, date)
  const items = await Promise.all(movieRows.map(async (r) => {
    const schedules = date ? await MovieService.getSchedulesByMovieId(r.id, date) : []
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      durationMin: r.duration_min,
      thumbnailUrl: r.thumbnail_url,
      status: r.status,
      schedules: schedules.map(s => ({
        scheduleId: s.schedule_id,
        screenName: s.screen_name,
        startsAt: s.starts_at,
        endsAt: s.ends_at,
        remainingSeats: Number(s.remaining_seats),
      })),
    }
  }))

  return c.json(successResponse({ items }, requestId))
}

export const getMovie = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const movieId = Number(c.req.param('movieId'))

  if (!Number.isInteger(movieId) || movieId <= 0) throw new AppError('VALIDATION_ERROR', 'Invalid movieId')

  const movie = await MovieService.getMovieById(movieId)
  if (!movie) throw new AppError('NOT_FOUND', 'Movie not found')

  return c.json(successResponse({
    id: movie.id,
    title: movie.title,
    description: movie.description,
    durationMin: movie.duration_min,
    thumbnailUrl: movie.thumbnail_url,
    status: movie.status,
  }, requestId))
}

export const getMovieSchedules = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const movieId = Number(c.req.param('movieId'))
  const date = c.req.query('date')

  if (!Number.isInteger(movieId) || movieId <= 0) throw new AppError('VALIDATION_ERROR', 'Invalid movieId')
  if (date && !DATE_RE.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')

  const movie = await MovieService.getMovieById(movieId)
  if (!movie) throw new AppError('NOT_FOUND', 'Movie not found')

  const rows = await MovieService.getSchedulesByMovieId(movieId, date)

  return c.json(successResponse({
    movie: {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      durationMin: movie.duration_min,
      thumbnailUrl: movie.thumbnail_url,
      status: movie.status,
    },
    schedules: rows.map(r => ({
      scheduleId: r.schedule_id,
      screenName: r.screen_name,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      remainingSeats: Number(r.remaining_seats),
    })),
  }, requestId))
}

export const getSchedule = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const scheduleId = Number(c.req.param('scheduleId'))

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) throw new AppError('VALIDATION_ERROR', 'Invalid scheduleId')

  const r = await MovieService.getFullScheduleById(scheduleId)
  if (!r) throw new AppError('NOT_FOUND', 'Schedule not found')

  return c.json(successResponse({
    scheduleId: r.schedule_id,
    movieId: r.movie_id,
    movieTitle: r.movie_title,
    thumbnailUrl: r.thumbnail_url,
    durationMin: r.duration_min,
    screenName: r.screen_name,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    remainingSeats: Number(r.remaining_seats),
  }, requestId))
}
