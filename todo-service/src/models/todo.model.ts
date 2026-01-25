import { Elysia, t } from 'elysia'

export const Int32 = (options?: { description?: string }) =>
	t.Numeric({
		minimum: 1,
		maximum: 2147483647,
		error: 'ID must be a positive integer within 32-bit range (1 to 2,147,483,647)',
		...options
	})

export const BulkArray = (itemSchema: any, max = 10) =>
	t.Array(itemSchema, {
		minItems: 1,
		maxItems: max,
		error: `Batch operation must contain between 1 and ${max} todos`
	})

export const todoResponseModel = new Elysia().model({
	'todo.response': t.Object({
		id: Int32(),
		title: t.String({
			minLength: 1,
			maxLength: 255,
			pattern: '^(?!\\s*$).+'
		}),
		completed: t.Nullable(t.Boolean()),
		createdAt: t.Nullable(t.Date()),
		updatedAt: t.Nullable(t.Date())
	}),
	'todos.response': t.Object({
		count: t.Number(),
		data: t.Array(t.Ref('todo.response')),
		message: t.String()
	}),
	'error.response': t.Object({
		code: t.String(),
		message: t.String(),
		timestamp: t.String(),
		errors: t.Optional(t.Array(t.Any()))
	})
})

export const appErrorModel = (app: Elysia) =>
	app.onError(({ code, error, set }) => {
		const timestamp = new Date().toISOString()

		if (code === 'VALIDATION') {
			set.status = 400
			const err: any = error.all[0]
			return {
				code,
				message: `Validation Failed: ${err.schema?.error || err.summary || err.message}`,
				timestamp
			}
		}

		if (code === 'NOT_FOUND') {
			set.status = 404
			return { code, message: error.message, timestamp }
		}

		set.status = 500
		return {
			code: 'INTERNAL_ERROR',
			message: 'An unexpected error occurred',
			timestamp
		}
	})
