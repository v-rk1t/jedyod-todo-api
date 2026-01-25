import { describe, it, expect } from 'bun:test'
import { api } from '@/src/helpers/apiClient'
import { isoDateRegex } from '@/src/helpers/regex'

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
