import { Elysia, InternalServerError, NotFoundError, t } from 'elysia'
import { prisma } from '@/src/lib/prisma'

export const todoRoutes = new Elysia({ prefix: '/todos' })
	.model({
		'todo.response': t.Object({
			id: t.Number(),
			title: t.String(),
			completed: t.Union([t.Boolean(), t.Null()]),
			createdAt: t.Union([t.Date(), t.Null()]),
			updatedAt: t.Union([t.Date(), t.Null()])
		}),
		'error.response': t.Object({
			code: t.String(),
			message: t.String(),
			timestamp: t.String()
		})
	})

	.onError(({ code, error, set }) => {
		const timestamp = new Date().toISOString()

		if (code === 'INTERNAL_SERVER_ERROR') console.error(error)

		switch (code) {
			case 'NOT_FOUND':
				set.status = 404
				return { code, message: error.message, timestamp }
			case 'VALIDATION':
				set.status = 400
				return {
					code,
					message: 'Validation Failed',
					timestamp
				}
			default:
				set.status = 500
				return {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
					timestamp
				}
		}
	})

todoRoutes.get(
	'/',
	async () => {
		return await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
	},
	{
		response: t.Array(t.Ref('todo.response')),
		detail: { tags: ['Todos'], summary: 'List all todos' }
	}
)

todoRoutes.get(
	'/:id',
	async ({ params }) => {
		const todo = await prisma.todo.findUnique({
			where: { id: params.id }
		})

		if (!todo) throw new NotFoundError('Todo not found')
		return todo
	},
	{
		params: t.Object(
			{ id: t.Numeric() },
			{ description: 'The unique ID of the todo' }
		),
		response: {
			200: t.Ref('todo.response'),
			404: t.Ref('error.response')
		},
		detail: { tags: ['Todos'], summary: 'Get a single todo' }
	}
)

todoRoutes.post(
	'/',
	async ({ body, set }) => {
		set.status = 201
		return await prisma.todo.create({
			data: { title: body.title }
		})
	},
	{
		body: t.Object(
			{
				title: t.String({ minLength: 1 })
			},
			{ description: 'The title of new todo' }
		),
		response: { 201: t.Ref('todo.response') },
		detail: { tags: ['Todos'], summary: 'Create a new todo' }
	}
)

todoRoutes.put(
	'/:id',
	async ({ params, body }) => {
		try {
			return await prisma.todo.update({
				where: { id: params.id },
				data: {
					title: body.title,
					completed: body.completed
				}
			})
		} catch (error: any) {
			if (error.code === 'P2025')
				throw new NotFoundError('Todo not found')
			throw new InternalServerError()
		}
	},
	{
		params: t.Object({
			id: t.Numeric({ description: 'The unique ID of the todo' })
		}),
		body: t.Object({
			title: t.String({ minLength: 1 }),
			completed: t.Boolean()
		}),
		response: {
			200: t.Ref('todo.response'),
			404: t.Ref('error.response')
		},
		detail: {
			tags: ['Todos'],
			summary: 'Full update todo'
		}
	}
)

todoRoutes.patch(
	'/:id',
	async ({ params, body }) => {
		try {
			return await prisma.todo.update({
				where: { id: params.id },
				data: body
			})
		} catch (error: any) {
			if (error.code === 'P2025')
				throw new NotFoundError('Todo not found')
			throw new InternalServerError()
		}
	},
	{
		params: t.Object(
			{ id: t.Numeric() },
			{ description: 'The unique ID of the todo' }
		),
		body: t.Partial(
			t.Object({
				title: t.String(),
				completed: t.Boolean()
			})
		),
		response: {
			200: t.Ref('todo.response'),
			404: t.Ref('error.response')
		},
		detail: { tags: ['Todos'], summary: 'Partial update todo' }
	}
)

todoRoutes.delete(
	'/:id',
	async ({ params, set }) => {
		try {
			await prisma.todo.delete({ where: { id: params.id } })
			set.status = 204
		} catch (error: any) {
			if (error.code === 'P2025')
				throw new NotFoundError('Todo not found')
			throw new InternalServerError()
		}
	},
	{
		params: t.Object(
			{ id: t.Numeric() },
			{ description: 'The unique ID of the todo' }
		),
		response: {
			204: t.Null(),
			404: t.Ref('error.response')
		},
		detail: { tags: ['Todos'], summary: 'Delete a todo' }
	}
)
