// export const ENV_PROTOCOL = import.meta.env.VITE_PROTOCOL

export const ENV_HOST = import.meta.env.VITE_HOST

export const ENV_PORT = import.meta.env.VITE_PORT

export const ENV_SUFFIX = import.meta.env.VITE_SUFFIX

export const ENV_WIDTH = import.meta.env.VITE_WIDTH

export const ENV_HEIGHT = import.meta.env.VITE_HEIGHT

const url = new URL(window.location.href)

export const QUERY = Object.fromEntries(url.searchParams.entries())

export const PROTOCOL = QUERY.protocol || import.meta.env.VITE_PROTOCOL || 'http'

export const NAME = QUERY.name || import.meta.env.VITE_NAME || 'noname'

export const HOST = QUERY.host || ENV_HOST

export const PORT = QUERY.port || ENV_PORT

export const SUFFIX = QUERY.suffix || ENV_SUFFIX

export const CAMERA = QUERY.camera || 'environment'

export const API_URL = `${PROTOCOL}://${HOST}:${PORT}${SUFFIX}`

export const INTERVAL = parseInt(QUERY.interval) || 1000

export const WIDTH = parseInt(QUERY.width || ENV_WIDTH || 512)

export const HEIGHT = parseInt(QUERY.height || ENV_HEIGHT || 512)

export const CODES = {
	NON_ACTIVE_PUBLISH: 'non_active_publish',
}
