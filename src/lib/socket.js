import chalk from 'chalk'
import { CODES, SOCKET_URL } from './constants'
import logger from './logger'
import store, { setConnected, setActive, setServerState } from './redux'

const { dispatch, getState } = store

const RECONNECT_INTERVAL = 10

export let ws

let wsTimeout

export const send = (type, payload) => {
	if (ws?.readyState === WebSocket.OPEN) {
		if (typeof type === 'string') ws.send(JSON.stringify({ type, payload }))
		else ws.send(type)
	}
}

export const connect = () => {
	logger.info(`Connecting...`)
	clearTimeout(wsTimeout)

	if (ws?.readyState === WebSocket.OPEN) {
		ws.close()
	}

	try {
		ws = new WebSocket(SOCKET_URL)
	} catch (e) {
		logger.warn(`Failed to create websocket, retrying in ${RECONNECT_INTERVAL}`)
		wsTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
	}

	ws.onopen = () => {
		logger.info(chalk.green('Connected'))
		dispatch(setConnected(true))
	}

	ws.onerror = () => {
		logger.warn('Failed to connect')
	}

	ws.onclose = () => {
		dispatch(setConnected(false))
		logger.info(`Closed, retrying in ${RECONNECT_INTERVAL}`)
		wsTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
	}

	ws.onmessage = e => {
		const { type, payload } = JSON.parse(e.data)
		logger.info('ws:', type, payload)
		switch (type) {
			case 'connected': {
				dispatch(setConnected(payload))
				const { parameters } = getState().app.server
				send('set_parameters', { ...parameters, override: false })
				break
			}
			case 'state': {
				const { parameters } = payload
				if (parameters) {
					for (const a in parameters) {
						if (a !== 'prompt') {
							if (typeof parameters[a] === 'string') {
								logger.warn(`parameter ${a} is string, casting`)
								parameters[a] = Number(parameters[a])
							}
						}
					}
				}

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
				logger.error('Unknown message type', { type, payload })
		}
	}
}

export const close = () => {
	if (ws?.readyState === WebSocket.OPEN) {
		ws.close()
	}
}

export default {
	connect,
	send,
	close,
	ws,
}
