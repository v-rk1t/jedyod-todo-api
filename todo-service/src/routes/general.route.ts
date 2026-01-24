import { Elysia, t } from 'elysia'

const defaultText = `📝 Todo API running at http://localhost:3000
📑 Swagger available at http://localhost:3000/docs`

export const generalRoutes = new Elysia().get(
	'/',
	({ set }) => {
		set.status = 418
		return defaultText
	},
	{
		response: {
			418: t.String()
		},
		detail: {
			tags: ['General'],
			summary: "I'm a teapot",
			description: 'A standard HTCPCP/1.1 response for the root path.'
		}
	}
)
