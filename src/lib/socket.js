import { CODES, HOST, NAME, PORT } from './constants'
import logger from './logger'
import store, { setConnected, setActive, setServerState } from './redux'

const PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws'

const { dispatch, getState } = store

const websocketURL = `${PROTOCOL}://${HOST}${PORT ? ':' + PORT : ''}/api/ws?name=${NAME}`

let ws

const connect = () => {
	console.log(`Connecting to websocket at %c${websocketURL}`, 'color: #aaf')

	if (ws) {
		console.log('closing socket')
		ws.close()
	}

	ws = new WebSocket(websocketURL)

	ws.json = (type, payload) => {
		ws.send(JSON.stringify({ type, payload }))
	}

	ws.onopen = () => {
		logger.log('%cConnected to websocket', 'color: green')
		dispatch(setConnected(true))
	}

	ws.onclose = () => {
		dispatch(setConnected(false))
		// reconnect
		logger.log('.')
		setTimeout(connect, 1500)
	}

	ws.onerror = () => {
		logger.log('%cFailed to connect', 'color: orange;')
	}

	ws.onmessage = e => {
		const { type, payload } = JSON.parse(e.data)
		console.log('ws:', type, payload)
		switch (type) {
			case 'connected': {
				dispatch(setConnected(payload))
				const { parameters } = getState().app.server
				ws.json('set_parameters', { ...parameters, override: false })
				break
			}
			case 'state': {
				dispatch(setServerState(payload))
				break
			}
			case 'error': {
				if (payload.code === CODES.NON_ACTIVE_PUBLISH) {
					dispatch(setActive(false))
				}
				break
			}
			default:
				console.log('Unknown message type:', type)
		}
	}
}

connect()

export default ws
