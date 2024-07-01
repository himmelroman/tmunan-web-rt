import { HOST, LCM_STATUS, PORT } from './constants'
import logger from './logger'
import store, { setLCMStatus } from './redux'

// const PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws'
const PROTOCOL = 'ws'

export let ws = null

const { dispatch } = store

export async function start() {
	try {
		const userId = crypto.randomUUID()

		const websocketURL = `${PROTOCOL}:${HOST}:${PORT}/api/ws/${userId}`

		ws = new WebSocket(websocketURL)

		ws.onopen = () => {
			logger.log('%cConnected to websocket', 'color: green')
		}

		ws.onclose = () => {
			logger.log('Disconnected from websocket')
			dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))

			// reconnect
			setTimeout(start, 1500)
		}

		ws.onerror = () => {
			logger.log('%cFailed to connect', 'color: orange;')
		}

		ws.onmessage = event => {
			const data = JSON.parse(event.data)
			console.log('ws onmessage', data)
			if (data.status === LCM_STATUS.CONNECTED) {
				dispatch(setLCMStatus(LCM_STATUS.CONNECTED))
				window.userId = userId
				// eslint-disable-next-line no-case-declarations
				const s = store.getState()
				logger.log('sending parameters')
				send(s.app.parameters)
			} else {
				console.error('Invalid WS status')
				console.log('data', data)
				dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
			}
		}
	} catch (err) {
		logger.log('%cOut of loop error:', '%color:red;', err)
		window.uniqueId = null
	}
}

export function send(data) {
	if (ws && ws.readyState === WebSocket.OPEN) {
		if (data instanceof Blob) {
			logger.log('sending blob', data.size)
			ws.send(data)
		} else {
			ws.send(JSON.stringify(data))
		}
	} else {
		logger.log('%cWebSocket not connected', 'color: yellow')
	}
}

export async function stop() {
	if (ws) {
		ws.close()
	}
	ws = null
}

export default {
	start,
	send,
	stop,
	websocket: ws,
}
