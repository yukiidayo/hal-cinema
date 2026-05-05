import { Hono } from 'hono'
import type { AppEnv } from '../../types.js'
import { quote, getSeats, holdSeats, createReservation, getReservation, cancelReservation } from './handlers.js'

const router = new Hono<AppEnv>()

router.post('/reservations/quote', quote)
router.get('/reservations/schedules/:scheduleId/seats', getSeats)
router.post('/reservations/hold', holdSeats)
router.post('/reservations', createReservation)
router.get('/reservations/:reservationCode', getReservation)
router.post('/reservations/:reservationCode/cancel', cancelReservation)

export default router
