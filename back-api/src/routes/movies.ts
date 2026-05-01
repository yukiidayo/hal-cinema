import { Hono } from 'hono'
import { z } from 'zod'
import type mysql from 'mysql2/promise'
import type { AppEnv } from '../types.js'
import { pool } from '../db/client.js'
import { AppError } from '../lib/errors.js'
import { successResponse } from '../lib/response.js'

export const moviesRouter = new Hono<AppEnv>()

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// GET /api/movies
moviesRouter.get('/movies', async (c) => {
  const requestId = c.get('requestId')
  const date = c.req.query('date')
  const status = c.req.query('status')

  if (date && !DATE_RE.test(date)) {
    throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
  }
  if (status && !['now_showing', 'coming_soon'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid status value')
  }

  let sql = `SELECT id, title, description, duration_min, thumbnail_url, status FROM movies WHERE 1=1`
  const params: (string | number)[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (date) {
    sql += ` AND id IN (
      SELECT DISTINCT movie_id FROM schedules
      WHERE is_public = 1 AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?
    )`
    params.push(date)
  }
  sql += ' ORDER BY created_at DESC'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)

  return c.json(
    successResponse({
      items: rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        durationMin: r.duration_min,
        thumbnailUrl: r.thumbnail_url,
        status: r.status,
      })),
    }, requestId),
  )
})

// GET /api/movies/:movieId/schedules
moviesRouter.get('/movies/:movieId/schedules', async (c) => {
  const requestId = c.get('requestId')
  const movieId = Number(c.req.param('movieId'))
  const date = c.req.query('date')

  if (!Number.isInteger(movieId) || movieId <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid movieId')
  }
  if (date && !DATE_RE.test(date)) {
    throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
  }

  const [movieRows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id, title, description, duration_min, thumbnail_url, status FROM movies WHERE id = ?',
    [movieId],
  )
  if (movieRows.length === 0) throw new AppError('NOT_FOUND', 'Movie not found')

  let sql = `
    SELECT
      sch.id as schedule_id,
      sc.name as screen_name,
      sch.starts_at,
      sch.ends_at,
      sc.total_seats - COALESCE((
        SELECT COUNT(*) FROM reservation_seats rs
        JOIN reservations r ON r.id = rs.reservation_id
        WHERE rs.schedule_id = sch.id AND r.status = 'confirmed'
      ), 0) as remaining_seats
    FROM schedules sch
    JOIN screens sc ON sc.id = sch.screen_id
    WHERE sch.movie_id = ? AND sch.is_public = 1`
  const params: (string | number)[] = [movieId]

  if (date) {
    sql += ` AND DATE(CONVERT_TZ(sch.starts_at, '+00:00', '+09:00')) = ?`
    params.push(date)
  }
  sql += ' ORDER BY sch.starts_at'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)

  const m = movieRows[0]
  return c.json(
    successResponse({
      movie: {
        id: m.id,
        title: m.title,
        description: m.description,
        durationMin: m.duration_min,
        thumbnailUrl: m.thumbnail_url,
        status: m.status,
      },
      schedules: rows.map(r => ({
        scheduleId: r.schedule_id,
        screenName: r.screen_name,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        remainingSeats: Number(r.remaining_seats),
      })),
    }, requestId),
  )
})

// GET /api/schedules/:scheduleId  (チケット選択ページ用)
moviesRouter.get('/schedules/:scheduleId', async (c) => {
  const requestId = c.get('requestId')
  const scheduleId = Number(c.req.param('scheduleId'))

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid scheduleId')
  }

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       sch.id as schedule_id,
       sch.movie_id,
       m.title as movie_title,
       m.thumbnail_url,
       m.duration_min,
       sc.name as screen_name,
       sch.starts_at,
       sch.ends_at,
       sc.total_seats - COALESCE((
         SELECT COUNT(*) FROM reservation_seats rs
         JOIN reservations r ON r.id = rs.reservation_id
         WHERE rs.schedule_id = sch.id AND r.status = 'confirmed'
       ), 0) as remaining_seats
     FROM schedules sch
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE sch.id = ? AND sch.is_public = 1`,
    [scheduleId],
  )

  if (rows.length === 0) throw new AppError('NOT_FOUND', 'Schedule not found')

  const r = rows[0]
  return c.json(
    successResponse({
      scheduleId: r.schedule_id,
      movieId: r.movie_id,
      movieTitle: r.movie_title,
      thumbnailUrl: r.thumbnail_url,
      durationMin: r.duration_min,
      screenName: r.screen_name,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      remainingSeats: Number(r.remaining_seats),
    }, requestId),
  )
})
