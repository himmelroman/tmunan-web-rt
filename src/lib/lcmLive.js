import store from './redux'

import { setLCMStatus, setStreamId } from './redux'

import { HOST, PORT, LCM_STATUS } from './constants'

let websocket = null

const { dispatch } = store

const getSreamdata = () => {
	const parameters = store.getState().app.parameters
	const blob = window.blob

	// console.log('getStreamData', parameters, blob)

	return [parameters, blob]
}

export async function start() {
	return new Promise((resolve, reject) => {
		try {
			const userId = crypto.randomUUID()
			const websocketURL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}:${HOST}:${PORT}/api/ws/${userId}`

			websocket = new WebSocket(websocketURL)
			websocket.onopen = () => {
				console.log('Connected to websocket')
			}
			websocket.onclose = () => {
				dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
				console.log('Disconnected from websocket')
			}
			websocket.onerror = err => {
				console.error(err)
			}
			websocket.onmessage = event => {
				const data = JSON.parse(event.data)
				switch (data.status) {
					case 'connected':
						dispatch(setLCMStatus(LCM_STATUS.CONNECTED))
						dispatch(setStreamId(userId))
						resolve({ status: 'connected', userId })
						break
					case 'send_frame':
						dispatch(setLCMStatus(LCM_STATUS.SEND_FRAME))
						// eslint-disable-next-line no-case-declarations
						const streamData = getSreamdata()
						websocket?.send(JSON.stringify({ status: 'next_frame' }))
						for (const d of streamData) {
							send(d)
						}
						break
					case 'wait':
						dispatch(setLCMStatus(LCM_STATUS.WAIT))
						break
					case 'timeout':
						console.log('timeout')
						dispatch(setLCMStatus(LCM_STATUS.TIMEOUT))
						dispatch(setStreamId(null))
						reject(new Error('timeout'))
						break
					case 'error':
						console.log(data.message)
						dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
						dispatch(setStreamId(null))
						reject(new Error(data.message))
						break
				}
			}
		} catch (err) {
			console.error(err)
			dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
			dispatch(setStreamId(null))
			reject(err)
		}
	})
}

export function send(data) {
	if (websocket && websocket.readyState === WebSocket.OPEN) {
		if (data instanceof Blob) {
			websocket.send(data)
		} else {
			websocket.send(JSON.stringify(data))
		}
	} else {
		console.log('WebSocket not connected')
	}
}

export async function stop() {
	dispatch(setLCMStatus(LCM_STATUS.DISCONNECTED))
	if (websocket) {
		websocket.close()
	}
	websocket = null
	dispatch(setStreamId(null))
}

export default {
	start,
	send,
	stop,
}
