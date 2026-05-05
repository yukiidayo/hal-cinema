import { Hono } from 'hono'
import type { AppEnv } from '../../types.js'
import { createMember, getProfile, getReservations } from './handlers.js'

const router = new Hono<AppEnv>()

router.post('/members', createMember)
router.get('/members/profile', getProfile)
router.get('/members/reservations', getReservations)

export default router
