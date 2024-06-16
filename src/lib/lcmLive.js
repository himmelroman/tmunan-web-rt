import { HOST, LCM_STATUS, PORT } from './constants'
import logger from './logger'
import store, { setLCMStatus } from './redux'

export let ws = null

const { dispatch } = store

export async function start() {
	try {
		const userId = crypto.randomUUID()
		const websocketURL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}:${HOST}:${PORT}/api/ws/${userId}`

		ws = new WebSocket(websocketURL)

		ws.onopen = () => {
			logger.log('%cConnected to websocket', 'color: green')
		}

		ws.onclose = () => {
			logger.log('Disconnected from websocket')
			dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
		}

		ws.onerror = () => {
			logger.log('%cFailed to connect', 'color: orange;')
		}

		ws.onmessage = event => {
			const data = JSON.parse(event.data)
			switch (data.error) {
				case 'connected':
					dispatch(setLCMStatus(LCM_STATUS.CONNECTED))
					window.userId = userId
					// eslint-disable-next-line no-case-declarations
					const s = store.getState()
					logger.log('sending parameters')
					send(s.app.parameters)
					break
				case 'send_frame':
					logger.log('%cDeprecated: send_frame', 'color: yellow')
					// dispatch(setLCMStatus(LCM_STATUS.SEND_FRAME))
					// const streamData = getSreamdata()
					// websocket?.send(JSON.stringify({ status: 'next_frame' }))
					// for (const d of streamData) {
					// 	send(d)
					// }
					break
				case 'wait':
					dispatch(setLCMStatus(LCM_STATUS.WAIT))
					break
				case 'timeout':
					window.uniqueId = null
					dispatch(setLCMStatus(LCM_STATUS.TIMEOUT))
					break
				case 'error':
					logger.log('%cError message:', 'color:red;', data.message)
					dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
					window.uniqueId = null
					break
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
