type RequestOptions = RequestInit & {
	params?: Record<string, string | number>
	useAuth?: boolean
}

export class ApiClient {
	readonly baseUrl: string
	private token: string | null = null

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	}

	setToken(token: string) {
		this.token = token.startsWith('Bearer ') ? token : `Bearer ${token}`
	}

	async request(path: string, options: RequestOptions = {}) {
		const { params, headers, useAuth = true, ...rest } = options

		let url = `${this.baseUrl}${path}`
		if (params) {
			const queryString = new URLSearchParams(params as any).toString()
			url += `?${queryString}`
		}

		const defaultHeaders: Record<string, string> = {
			'Content-Type': 'application/json'
		}

		if (useAuth && this.token) {
			defaultHeaders['Authorization'] = this.token
		}

		const response = await fetch(url, {
			...rest,
			headers: {
				...defaultHeaders,
				...headers
			}
		})

		const contentType = response.headers.get('content-type')
		let data = null
		if (contentType?.includes('application/json')) {
			data = await response.json()
		}

		return {
			status: response.status,
			ok: response.ok,
			data,
			headers: response.headers
		}
	}

	get(path: string, options?: RequestOptions) {
		return this.request(path, { ...options, method: 'GET' })
	}

	post(path: string, body?: any, options?: RequestOptions) {
		return this.request(path, {
			...options,
			method: 'POST',
			body: JSON.stringify(body)
		})
	}

	put(path: string, body?: any, options?: RequestOptions) {
		return this.request(path, {
			...options,
			method: 'PUT',
			body: JSON.stringify(body)
		})
	}

	patch(path: string, body?: any, options?: RequestOptions) {
		return this.request(path, {
			...options,
			method: 'PATCH',
			body: JSON.stringify(body)
		})
	}

	delete(path: string, body?: any, options?: RequestOptions) {
		return this.request(path, {
			...options,
			method: 'DELETE',
			body: JSON.stringify(body)
		})
	}
}

export const api = new ApiClient(process.env.BASE_URL || '')
