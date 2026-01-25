import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { api } from '@/src/helpers/apiClient'
import { isoDateRegex } from '@/src/helpers/regex'

beforeAll(async () => {
	const { data } = await api.post('/auth', { username: 'bun_test' })
	api.setToken(data.token)
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

afterAll(async () => {
	const reset = await api.post('/tools/reset')
	const seed = await api.post('/tools/seed')
	expect(reset.status).toBe(200)
	expect(seed.status).toBe(200)
})
