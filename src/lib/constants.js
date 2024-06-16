// export const ENV_PROTOCOL = import.meta.env.VITE_PROTOCOL

export const ENV_HOST = import.meta.env.VITE_HOST

export const ENV_PORT = import.meta.env.VITE_PORT

export const ENV_SUFFIX = import.meta.env.VITE_SUFFIX

const url = new URL(window.location.href)

export const QUERY = Object.fromEntries(url.searchParams.entries())

export const PROTOCOL = QUERY.protocol || import.meta.env.VITE_PROTOCOL || 'http'

export const HOST = QUERY.host || ENV_HOST

export const PORT = QUERY.port || ENV_PORT

export const SUFFIX = QUERY.suffix || ENV_SUFFIX

export const CAMERA = QUERY.camera || 'environment'

export const API_URL = `${PROTOCOL}://${HOST}:${PORT}${SUFFIX}`

export const INTERVAL = parseInt(QUERY.interval) || 1000

export const WIDTH = 512 // QUERY.width || import.meta.env.VITE_WIDTH || 512

export const HEIGHT = 512 // QUERY.height || import.meta.env.VITE_HEIGHT || 512

// LCM

export const LCM_STATUS = {
	DISCONNECTED: 'disconnected',
	TIMEOUT: 'timeout',
	CONNECTED: 'connected',
	WAIT: 'wait',
	SEND_FRAME: 'send_frame',
}

export const LCM_STATUS_COLOR = {
	disconnected: '#f88',
	timeout: '#f88',
	connected: '#5f5',
	wait: '#ff4',
	send_frame: '#ff4',
}
