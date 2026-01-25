import { Elysia, t } from 'elysia'
import { prisma } from '@/src/lib/prisma'

export const toolsRoutes = new Elysia({ prefix: '/tools' })
	.post(
		'/reset',
		async () => {
			await prisma.$executeRawUnsafe(
				`TRUNCATE TABLE "Todo" RESTART IDENTITY CASCADE;`
			)
			return {
				message: 'Database reset and auto-increment restarted at 1'
			}
		},
		{
			detail: { tags: ['Tools'], summary: 'Reset DB and Auto-Increment' }
		}
	)

	.post(
		'/seed',
		async () => {
			await prisma.todo.createMany({
				data: [
					{ title: 'Go to Italy', completed: true },
					{ title: 'Join Passione', completed: false },
					{ title: 'Find the arrow', completed: false }
				]
			})
			return { message: 'Database seeded' }
		},
		{
			detail: {
				tags: ['Tools'],
				summary: 'Seed DB with initial test data'
			}
		}
	)

	.get(
		'/health',
		async ({ set }) => {
			try {
				await prisma.$queryRaw`SELECT 1`

				return {
					status: 'ok',
					database: 'connected',
					version: '1.0.0',
					uptime: process.uptime()
				}
			} catch (error: any) {
				set.status = 503
				console.error('Health check failed:', error.message)

				return {
					status: 'error',
					database: 'disconnected',
					message: 'Database connection failed'
				}
			}
		},
		{
			response: {
				200: t.Object({
					status: t.String(),
					database: t.String(),
					version: t.String(),
					uptime: t.Number()
				}),
				503: t.Object({
					status: t.String(),
					database: t.String(),
					message: t.String()
				})
			},
			detail: {
				tags: ['Tools'],
				summary: 'DB Health Check',
				description:
					'Checks connectivity to the database. Returns 503 if the DB is unreachable.'
			}
		}
	)
