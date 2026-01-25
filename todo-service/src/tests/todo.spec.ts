import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { api } from '@/src/helpers/apiClient'
import { type Todo } from '@/generated/prisma/client'

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

beforeAll(async () => {
	const { data } = await api.post('/auth', { username: 'bun_test' })
	api.setToken(data.token)
})

describe('E2E test scenarios', () => {
	describe('Todo scenario', () => {
		let todoId: number
		const todoTitle = 'Visit the Colosseum'

		it('POST - should create a single todo', async () => {
			const { data, status } = await api.post('/todo', {
				title: `  ${todoTitle}  `
			})

			expect(status).toBe(201)
			expect(data.data).toHaveLength(1)
			expect(data.data[0]).toStrictEqual({
				id: expect.any(Number),
				title: todoTitle,
				completed: false,
				createdAt: expect.stringMatching(isoDateRegex),
				updatedAt: expect.stringMatching(isoDateRegex)
			})
			todoId = data.data[0].id
		})

		it('GET - should fetch a todo by ID', async () => {
			const { data, status } = await api.get(`/todo/${todoId}`)

			expect(status).toBe(200)
			expect(data.data).toHaveLength(1)
			expect(data.data[0]).toStrictEqual({
				id: todoId,
				title: todoTitle,
				completed: false,
				createdAt: expect.stringMatching(isoDateRegex),
				updatedAt: expect.stringMatching(isoDateRegex)
			})
		})

		it('PATCH - should update a todo', async () => {
			const { data, status } = await api.patch(`/todo/${todoId}`, {
				completed: true
			})

			expect(status).toBe(200)
			expect(data.data).toHaveLength(1)
			expect(data.data[0]).toStrictEqual({
				id: todoId,
				title: todoTitle,
				completed: true,
				createdAt: expect.stringMatching(isoDateRegex),
				updatedAt: expect.stringMatching(isoDateRegex)
			})
		})

		it('DELETE - should delete a todo', async () => {
			const { data, status } = await api.delete(`/todo/${todoId}`)

			expect(status).toBe(200)
			expect(data.data).toHaveLength(1)
			expect(data).toStrictEqual({
				count: 1,
				data: [
					{
						id: todoId,
						title: todoTitle,
						completed: true,
						createdAt: expect.stringMatching(isoDateRegex),
						updatedAt: expect.stringMatching(isoDateRegex)
					}
				],
				message: 'Successfully deleted todo'
			})
		})
	})

	describe('Todos scenario', () => {
		let todoIds: number[] = []

		it('POST - should create multiple todos', async () => {
			const payload = [
				{
					title: 'Take an authentic matcha from Japan',
					completed: true
				},
				{ title: 'Eat Indian cuisine', completed: false },
				{ title: 'Learn to walk like an Egyptian' }
			]

			const { data, status } = await api.post('/todos', payload)

			expect(status).toBe(201)
			expect(data.data).toHaveLength(3)
			todoIds = data.data.map((t: any) => t.id)
		})

		it('GET - should fetch all todos', async () => {
			const { data, status } = await api.get('/todos')

			expect(status).toBe(200)
			// body.forEach becomes data.forEach based on your client structure
			data.forEach((todo: Todo) => {
				expect(todo).toEqual(
					expect.objectContaining({
						id: expect.any(Number),
						title: expect.any(String),
						completed: expect.any(Boolean),
						createdAt: expect.stringMatching(isoDateRegex),
						updatedAt: expect.stringMatching(isoDateRegex)
					})
				)
			})
		})

		it('PATCH - should update multiple todos', async () => {
			const { data, status } = await api.patch('/todos', {
				ids: todoIds,
				completed: true
			})

			expect(status).toBe(200)
			expect(data.count).toBe(3)
			expect(data.data.every((t: any) => t.completed === true)).toBe(true)
		})

		it('DELETE - should delete multiple todos', async () => {
			const { data, status } = await api.delete('/todos', {
				ids: todoIds
			})

			expect(status).toBe(200)
			expect(data.count).toBe(3)
			expect(data.data).toHaveLength(3)
		})
	})
})

describe('Unit API tests', () => {
	describe('/auth', async () => {
		it('should return 200 and token when provided username length equal or more than 3', async () => {
			const { data } = await api.post('/auth', { username: 'bun' })

			expect(data).toStrictEqual({
				token: expect.any(String),
				type: 'Bearer',
				message: 'Authentication successful'
			})
		})

		it('should return 400 and error message when provided username length is less than 3', async () => {
			const { data } = await api.post('/auth', { username: 'xt' })

			expect(data).toStrictEqual({
				code: 'VALIDATION',
				message:
					'Validation Failed: Expected string length greater or equal to 3',
				timestamp: expect.stringMatching(isoDateRegex)
			})
		})
	})

	describe('/todo', async () => {
		let todoId: number

		beforeAll(async () => {
			const { data, status } = await api.post('/todo', {
				title: '/todo error validation'
			})
			expect(status).toBe(201)
			todoId = data.data[0].id
		})

		describe('POST - create a todo', () => {
			const cases = [
				{
					description: 'title is empty string',
					payload: { title: '' },
					message: 'Expected string length greater or equal to 1'
				},
				{
					description: 'title is only whitespace',
					payload: { title: '   ' },
					message: 'Expected string length greater or equal to 1'
				},
				{
					description: 'title is longer than 255 characters',
					payload: { title: 'A'.repeat(256) },
					message: 'Expected string length less or equal to 255'
				},
				{
					description: 'payload is missing title',
					payload: {},
					message:
						"Expected property 'title' to be string but found: undefined"
				}
			]

			cases.forEach(({ description, payload, message }) => {
				it(`should return 400 when ${description}`, async () => {
					const { data, status } = await api.post('/todo', payload)

					expect(status).toBe(400)
					expect(data).toStrictEqual({
						code: 'VALIDATION',
						message: `Validation Failed: ${message}`,
						timestamp: expect.stringMatching(isoDateRegex)
					})
				})
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.post(
					'/todo',
					{ title: 'No auth' },
					{ useAuth: false }
				)

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})

		describe('GET - list a todo', () => {
			const cases = [
				{ description: 'no id is provided', id: undefined },
				{ id: 0, description: 'id is 0 (out of range)' },
				{
					id: 2147483648,
					description: 'id is too large (Int32 overflow)'
				},
				{ id: 'abc', description: 'id is not a number' }
			]

			cases.forEach(({ id, description }) => {
				it(`should return 400 and error message when ${description}`, async () => {
					const { data, status } = await api.get(`/todo/${id}`)

					expect(status).toBe(400)
					expect(data).toStrictEqual({
						code: 'VALIDATION',
						message:
							'Validation Failed: ID must be a positive integer within 32-bit range (1 to 2,147,483,647)',
						timestamp: expect.stringMatching(isoDateRegex)
					})
				})
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.get(`/todo/${todoId}`, {
					useAuth: false
				})

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})

		describe('PATCH - update a todo', () => {
			const cases = [
				{
					description: 'title is whitespace only',
					payload: { title: '   ' },
					message: 'Expected string length greater or equal to 1'
				},
				{
					description: 'title is longer than 255 characters',
					payload: { title: 'A'.repeat(256) },
					message: 'Expected string length less or equal to 255'
				},
				{
					description: 'completed is not a boolean',
					payload: { completed: 'yes' },
					message: 'Expected boolean'
				}
			]

			cases.forEach(({ description, payload, message }) => {
				it(`should return 400 and error message when ${description}`, async () => {
					const { data, status } = await api.patch(
						`/todo/${todoId}`,
						payload
					)

					expect(status).toBe(400)
					expect(data).toStrictEqual({
						code: 'VALIDATION',
						message: `Validation Failed: ${message}`,
						timestamp: expect.stringMatching(isoDateRegex)
					})
				})
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.patch(
					`/todo/${todoId}`,
					{ completed: false },
					{ useAuth: false }
				)

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})

		describe('DELETE - delete a todo', async () => {
			const errorMessage =
				'ID must be a positive integer within 32-bit range (1 to 2,147,483,647)'
			const cases = [
				{
					description: 'no id is provided',
					id: undefined,
					message: errorMessage
				},
				{
					id: 0,
					description: 'id is 0 (out of range)',
					message: errorMessage
				},
				{
					id: 2147483648,
					description: 'id is too large (Int32 overflow)',
					message: errorMessage
				},
				{
					id: 'abc',
					description: 'id is not a number',
					message: errorMessage
				}
			]

			cases.forEach(({ id, description, message }) => {
				it(`should return 400 and error message when ${description}`, async () => {
					const { data, status } = await api.delete(`/todo/${id}`)

					expect(status).toBe(400)
					expect(data).toStrictEqual({
						code: 'VALIDATION',
						message: `Validation Failed: ${message}`,
						timestamp: expect.stringMatching(isoDateRegex)
					})
				})
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.delete(
					'/todo/1',
					{ id: 1 },
					{
						useAuth: false
					}
				)

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})
	})

	describe('/todos', async () => {
		describe('PATCH - update todos', () => {
			it('should return 404 and error message when one or more of provided ids not found', async () => {
				const { data: createData } = await api.post('/todo', {
					title: 'Prevent the boss to reach the truth'
				})
				const todoId = createData.data[0].id
				const missId = 999999

				const { data, status } = await api.patch('/todos', {
					ids: [todoId, missId],
					title: 'Retrieve the Stand disc'
				})

				expect(status).toBe(404)
				expect(data).toStrictEqual({
					code: 'NOT_FOUND',
					message: `Update failed. Missing IDs: ${missId}`,
					timestamp: expect.stringMatching(isoDateRegex)
				})
			})

			it('should return 400 when IDs are not Int32 (out of range)', async () => {
				const { data, status } = await api.patch('/todos', {
					ids: [3000000000],
					completed: true
				})

				expect(status).toBe(400)
				expect(data.message).toContain('32-bit range')
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.patch(
					'/todos',
					{ ids: [1, 2], title: 'Breakout of jail' },
					{ useAuth: false }
				)

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})

		describe('POST - create todos', () => {
			const errorMessage =
				'Batch operation must contain between 1 and 10 todos'
			const cases = [
				{
					description: 'array is empty',
					payload: [],
					message: errorMessage
				},
				{
					description:
						'exceeding max multiple todos limit (11 items)',
					payload: Array(11).fill({ title: 'Task' }),
					message: errorMessage
				},
				{
					description: 'missing title in one of the todos',
					payload: [{ title: 'Valid' }, { completed: true }],
					message:
						"Expected property '1.title' to be string but found: undefined"
				},
				{
					description: 'whitespace-only title',
					payload: [{ title: '   ' }],
					message: 'Expected string length greater or equal to 1'
				}
			]

			cases.forEach(({ description, payload, message }) => {
				it(`should return 400 and error message when ${description}`, async () => {
					const { data, status } = await api.post('/todos', payload)

					expect(status).toBe(400)
					expect(data).toStrictEqual({
						code: 'VALIDATION',
						message: `Validation Failed: ${message}`,
						timestamp: expect.stringMatching(isoDateRegex)
					})
				})
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.post(
					'/todos',
					[{ title: 'One' }, { title: 'Two' }],
					{ useAuth: false }
				)

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})

		describe('DELETE - delete todos', () => {
			it('should return 400 and error message when ids property is not an array', async () => {
				const { data, status } = await api.delete('/todos', { ids: {} })

				expect(status).toBe(400)
				expect(data).toStrictEqual({
					code: 'VALIDATION',
					message:
						'Validation Failed: ID must be a positive integer within 32-bit range (1 to 2,147,483,647)',
					timestamp: expect.stringMatching(isoDateRegex)
				})
			})

			it('should return 401 and error message when no authorization in headers', async () => {
				const { data, status } = await api.delete(
					'/todos',
					{ ids: [1, 2] },
					{ useAuth: false }
				)

				expect(status).toBe(401)
				expect(data).toStrictEqual({
					code: 'UNAUTHORIZED',
					message: 'Missing token'
				})
			})
		})
	})
})

afterAll(async () => {
	const reset = await api.post('/tools/reset')
	const seed = await api.post('/tools/seed')
	expect(reset.status).toBe(200)
	expect(seed.status).toBe(200)
})
