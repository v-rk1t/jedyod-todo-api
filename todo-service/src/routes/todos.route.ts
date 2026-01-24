import { Elysia, NotFoundError, t } from 'elysia'
import { prisma } from '@/src/lib/prisma'
import { Int32, todoResponseModel, BulkArray } from '@/src/models/todo.model'

export const todosRoutes = new Elysia({ prefix: '/todos' })
	.use(todoResponseModel)
	.get('/', () => prisma.todo.findMany({ orderBy: { id: 'desc' } }), {
		response: t.Array(t.Ref('todo.response')),
		detail: { tags: ['Todos'], summary: 'List all todos' }
	})

	.post(
		'/',
		async ({ body, set }) => {
			return await prisma.$transaction(async (tx) => {
				const { count } = await tx.todo.createMany({
					data: body.map((item) => ({
						title: item.title.trim(),
						completed: item.completed ?? false
					}))
				})

				const data = await tx.todo.findMany({
					take: count,
					orderBy: { id: 'desc' }
				})
				set.status = 'Created'
				return {
					count,
					data,
					message: `Successfully created ${count} todos`
				}
			})
		},
		{
			body: BulkArray(
				t.Object({
					title: t.String({ minLength: 1, maxLength: 255 }),
					completed: t.Optional(t.Boolean())
				}),
				10
			),
			response: { 201: t.Ref('todos.response') },
			detail: { tags: ['Todos'], summary: 'Create multiple todos' }
		}
	)

	.patch(
		'/',
		async ({ body }) => {
			const uniqueIds = Array.from(new Set(body.ids))
			const { ids, ...updateData } = body

			return await prisma.$transaction(async (tx) => {
				const { count } = await tx.todo.updateMany({
					where: { id: { in: uniqueIds } },
					data: { ...updateData, updatedAt: new Date() }
				})

				if (count !== uniqueIds.length) {
					const existing = await tx.todo.findMany({
						where: { id: { in: uniqueIds } },
						select: { id: true }
					})
					const existingIds = existing.map((i) => i.id)
					const missingIds = uniqueIds.filter(
						(id) => !existingIds.includes(id)
					)
					throw new NotFoundError(
						`Update failed. Missing IDs: ${missingIds.join(', ')}`
					)
				}

				const data = await tx.todo.findMany({
					where: { id: { in: uniqueIds } },
					orderBy: { updatedAt: 'desc' }
				})
				return {
					count,
					data,
					message: `Successfully updated ${count} todos`
				}
			})
		},
		{
			body: t.Object({
				ids: BulkArray(Int32(), 10),
				title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
				completed: t.Optional(t.Boolean())
			}),
			response: {
				200: t.Ref('todos.response'),
				404: t.Ref('error.response')
			},
			detail: { tags: ['Todos'], summary: 'Update multiple todos' }
		}
	)

	.delete(
		'/',
		async ({ body }) => {
			const uniqueIds = Array.from(new Set(body.ids))

			return await prisma.$transaction(async (tx) => {
				const data = await tx.todo.findMany({
					where: { id: { in: uniqueIds } }
				})

				if (data.length !== uniqueIds.length) {
					const foundIds = data.map((t) => t.id)
					const missingIds = uniqueIds.filter(
						(id) => !foundIds.includes(id)
					)
					throw new NotFoundError(
						`Delete failed. Missing IDs: ${missingIds.join(', ')}`
					)
				}

				const { count } = await tx.todo.deleteMany({
					where: { id: { in: uniqueIds } }
				})
				return {
					count,
					data,
					message: `Successfully deleted ${count} todos`
				}
			})
		},
		{
			body: t.Object({ ids: BulkArray(Int32(), 100) }),
			response: {
				200: t.Ref('todos.response'),
				404: t.Ref('error.response')
			},
			detail: { tags: ['Todos'], summary: 'Delete multiple todos' }
		}
	)
