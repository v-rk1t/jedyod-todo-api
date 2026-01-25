import { Elysia, NotFoundError, t } from 'elysia'
import { prisma } from '@/src/lib/prisma'
import { Int32, todoResponseModel } from '@/src/models/todo.model'

export const todoRoutes = new Elysia({ prefix: '/todo' })
	.use(todoResponseModel)

	.get(
		'/:id',
		async ({ params: { id } }) => {
			const todo = await prisma.todo.findUnique({ where: { id } })

			if (!todo) throw new NotFoundError(`Todo with ID ${id} not found`)

			return {
				count: 1,
				data: [todo],
				message: 'Successfully fetched todo'
			}
		},
		{
			params: t.Object({ id: Int32() }),
			response: {
				200: t.Ref('todos.response'),
				404: t.Ref('error.response')
			},
			detail: { tags: ['Todo'], summary: 'Get a single todo' }
		}
	)

	.post(
		'/',
		async ({ body, set }) => {
			const todo = await prisma.todo.create({
				data: { ...body, title: body.title.trim() }
			})

			set.status = 'Created'
			return {
				count: 1,
				data: [todo],
				message: 'Successfully created todo'
			}
		},
		{
			body: t.Object({
				title: t.String({ minLength: 1, maxLength: 255 })
			}),
			transform({ body }) {
				if (typeof body.title === 'string') {
					body.title = body.title.trim()
				}
			},
			response: { 201: t.Ref('todos.response') },
			detail: { tags: ['Todo'], summary: 'Create a new todo' }
		}
	)

	.patch(
		'/:id',
		async ({ params: { id }, body }) => {
			return await prisma.$transaction(async (tx) => {
				const exists = await tx.todo.findUnique({ where: { id } })
				if (!exists)
					throw new NotFoundError(`Todo with ID ${id} not found`)

				const updatedTodo = await tx.todo.update({
					where: { id },
					data: {
						...body,
						updatedAt: new Date()
					}
				})

				return {
					count: 1,
					data: [updatedTodo],
					message: 'Successfully updated todo'
				}
			})
		},
		{
			params: t.Object({ id: Int32() }),
			body: t.Partial(
				t.Object({
					title: t.String({ minLength: 1, maxLength: 255 }),
					completed: t.Boolean()
				})
			),
			transform({ body }) {
				if (body.title !== undefined) {
					body.title = body.title.trim()
				}
			},
			response: {
				200: t.Ref('todos.response'),
				404: t.Ref('error.response')
			},
			detail: { tags: ['Todo'], summary: 'Partial update a todo' }
		}
	)

	.delete(
		'/:id',
		async ({ params: { id } }) => {
			return await prisma.$transaction(async (tx) => {
				const todo = await tx.todo.findUnique({ where: { id } })
				if (!todo)
					throw new NotFoundError(`Todo with ID ${id} not found`)

				await tx.todo.delete({ where: { id } })

				return {
					count: 1,
					data: [todo],
					message: 'Successfully deleted todo'
				}
			})
		},
		{
			params: t.Object({ id: Int32() }),
			response: {
				200: t.Ref('todos.response'),
				404: t.Ref('error.response')
			},
			detail: { tags: ['Todo'], summary: 'Delete a todo' }
		}
	)
