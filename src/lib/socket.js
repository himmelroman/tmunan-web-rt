import chalk from 'chalk'
import { /* CODES, SOCKET_URL, */ BASE_URL, FPS, NAME } from './constants'
import logger from './logger'
import store, { setConnected, setPresence, selectIsActive } from './redux'

const { dispatch, getState } = store

// let ws
let pc
let dc

let wsTimeout
let retries = 0

let should_send = false

const sctpCauseCodes = [
	'No SCTP error',
	'Invalid stream identifier',
	'Missing mandatory parameter',
	'Stale cookie error',
	'Sender is out of resource (i.e., memory)',
	'Unable to resolve address',
	'Unrecognized SCTP chunk type received',
	'Invalid mandatory parameter',
	'Unrecognized parameters',
	'No user data (SCTP DATA chunk has no data)',
	'Cookie received while shutting down',
	'Restart of an association with new addresses',
	'User-initiated abort',
	'Protocol violation',
]

export const send = (type, payload) => {
	if (dc?.readyState === 'open') {
		if (typeof type === 'string') dc.send(JSON.stringify({ type, payload }))
		else dc.send(type)
	}
}

export const negotiate = async () => {
	console.log('negotiate')
	const s = getState()

	const { show_output } = s.app
	let query = `${BASE_URL}/offer?name=${NAME}`
	if (show_output) query += '&output=true'

	const offer = await pc.createOffer()
	console.log('created offer')

	pc.setLocalDescription(offer)
	console.log('setlocaldescription')

	await new Promise(resolve => {
		if (pc.iceGatheringState === 'complete') {
			resolve()
		} else {
			const checkState = () => {
				if (pc.iceGatheringState === 'complete') {
					pc.removeEventListener('icegatheringstatechange', checkState)
					resolve()
				}
			}
			pc.addEventListener('icegatheringstatechange', checkState)
		}
	})

	console.log('sending offer')
	const localOffer = pc.localDescription

	try {
		const answer = await fetch(query, {
			body: JSON.stringify({
				sdp: localOffer.sdp,
				type: localOffer.type,
				name: NAME,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'POST',
		}).then(res => res.json())

		console.log('set remote description')
		return pc.setRemoteDescription(answer)
	} catch (e) {
		console.log('Failed to send offer')
		reconnect()
	}

	// pc.createOffer()
	// 	.then(offer => pc.setLocalDescription(offer))
	// 	.then(() => {
	// 		// wait for ICE gathering to complete
	// 		return new Promise(resolve => {
	// 			if (pc.iceGatheringState === 'complete') {
	// 				resolve()
	// 			} else {
	// 				const checkState = () => {
	// 					if (pc.iceGatheringState === 'complete') {
	// 						pc.removeEventListener('icegatheringstatechange', checkState)
	// 						resolve()
	// 					}
	// 				}
	// 				pc.addEventListener('icegatheringstatechange', checkState)
	// 			}
	// 		})
	// 	})
	// .then(() => {
	// 	console.log('sending offer')
	// 	const offer = pc.localDescription
	// 	return fetch(query, {
	// 		body: JSON.stringify({
	// 			sdp: offer.sdp,
	// 			type: offer.type,
	// 			name: NAME,
	// 		}),
	// 		headers: {
	// 			'Content-Type': 'application/json',
	// 		},
	// 		method: 'POST',
	// 	})
	// })
	// .then(res => res.json())
	// .then(answer => {
	// 	logger.info('OK, setting remote description', answer)
	// 	return pc.setRemoteDescription(answer)
	// })
	// .catch(e => {
	// 	// alert(e)
	// 	console.error(e)
	// })
}

export const reconnect = () => {
	clearTimeout(wsTimeout)
	dispatch(setConnected(false))

	const RECONNECT_INTERVAL = parseInt(Math.min(Math.max(2, Math.pow(retries, 1.5)), 60))
	console.log(`reconnect in ${RECONNECT_INTERVAL}s...`)
	if (!retries) logger.info(`${chalk.red('Disconnected.')} Reconnecting...`)

	wsTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
	retries++
}

export const connect = async () => {
	console.log('%cCONNECT', 'color: yellow')
	if (pc) {
		pc.close()
		dc.onopen = null
		dc.onmessage = null
		dc.onclose = null
		dc.onerror = null
	}

	pc = new RTCPeerConnection({
		sdpSemantics: 'unified-plan',
		// iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
	})

	window.pc = pc

	// pc.addEventListener(
	// 	'icegatheringstatechange',
	// 	() => {
	// 		console.log('icegatheringstatechange', pc.iceGatheringState)
	// 	},
	// 	false
	// )

	pc.addEventListener(
		'iceconnectionstatechange',
		() => {
			console.log('iceconnectionstatechange', pc.iceConnectionState)
			if (pc.iceConnectionState === 'disconnected') {
				reconnect()
			}
		},
		false
	)

	// pc.addEventListener(
	// 	'signalingstatechange',
	// 	() => {
	// 		console.log('signalingstatechange', pc.signalingState)
	// 	},
	// 	false
	// )

	pc.addEventListener('track', e => {
		console.log('%cremote added track', 'color:#5f5;')
		window.output_vid.srcObject = e.streams[0]
	})

	// create data channel

	dc = pc.createDataChannel('data')

	dc.onopen = () => {
		logger.info(chalk.green('Connected'))
		dispatch(setConnected(true))
		retries = 0
	}

	dc.onmessage = e => {
		const { type, payload } = JSON.parse(e.data)
		logger.info('ws:', type, payload)
		switch (type) {
			case 'connected': {
				dispatch(setConnected(payload))
				const { parameters } = getState().app.presence
				send('set_parameters', { ...parameters, override: false })
				break
			}
			case 'state': {
				dispatch(setPresence(payload))
				break
			}
			case 'error': {
				logger.error(`Data error code: ${payload.code}`, payload)
				// if (payload.code === CODES.NON_ACTIVE_PUBLISH) {
				// 	dispatch(setActive(false))
				// }
				break
			}
			default:
				logger.error('Unknown message type', { type, payload })
		}
	}

	dc.onclose = () => {
		console.log('data channel close')
	}

	dc.onerror = ({ error }) => {
		// if (!retries)
		console.warn('Data channel error:', error.message)

		switch (error.errorDetail) {
			case 'sdp-syntax-error':
				console.error('	SDP syntax error in line ', error.sdpLineNumber)
				break
			case 'idp-load-failure':
				console.error('	Identity provider load failure: HTTP error ', error.httpRequestStatusCode)
				break
			case 'sctp-failure':
				if (error.sctpCauseCode < sctpCauseCodes.length) {
					console.error('	SCTP failure: ', error.sctpCauseCode, sctpCauseCodes[error.sctpCauseCode])
				} else {
					console.error('	Unknown SCTP error')
				}
				break
			case 'dtls-failure':
				if (error.receivedAlert) {
					console.error('	Received DLTS failure alert: ', error.receivedAlert)
				}
				if (error.sentAlert) {
					console.error('	Sent DLTS failure alert: ', error.receivedAlert)
				}
				break
		}
	}

	if (should_send) {
		const { camera } = getState().app
		window.camera = camera

		let stream = window.stream
		if (!stream) {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: camera,
					width: 9999,
				},
			})
			window.stream = stream
			window.source_vid.srcObject = stream
		}

		console.log('Adding track before first negotiate')
		pc.addTrack(stream.getVideoTracks()[0], stream)
	}

	negotiate()
}

export const setTrack = stream => {
	console.log('%csetTrack', 'color:#f96', !!stream)
	if (stream) should_send = true
	else should_send = false

	const senders = pc.getSenders()
	if (senders.length) {
		console.log('senders:', senders)
		// replace camera
		if (stream) {
			console.log('replacing track')
			senders[0].replaceTrack(stream.getVideoTracks()[0])
		}
		// else {
		// 	console.log('NO STREAM, IGNORING')
		// }
		else {
			console.log('no stream, reconnecting without track')
			connect()
			// pc.removeTrack(senders[0])
			// negotiate()
		}
	} else if (stream) {
		// add camera, renegotiate
		// const track = stream.getVideoTracks()[0]
		console.log('reconnecting with track')
		// pc.addTrack(track, stream)
		// negotiate()
		connect()
	} else {
		logger.warn('No stream to set, no stream to remove')
	}
}

window.setTrack = setTrack

// export const connect = () => {
// 	if (!retries) logger.info(`Connecting...`)
// 	clearTimeout(wsTimeout)

// 	if (ws?.readyState === WebSocket.OPEN) {
// 		logger.warn('Already connected')
// 		return
// 	}

// 	// try {
// 	ws = new WebSocket(SOCKET_URL)
// 	// } catch (e) {
// 	// 	logger.warn(`Failed to create websocket, retrying in ${RECONNECT_INTERVAL}`)
// 	// 	wsTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
// 	// }

// 	ws.onopen = () => {
// 		logger.info(chalk.green('Connected'))
// 		dispatch(setConnected(true))
// 		retries = 0
// 	}

// 	ws.onerror = () => {
// 		if (!retries) logger.warn('Failed to connect')
// 	}

// 	ws.onclose = () => {
// 		dispatch(setConnected(false))

// 		const RECONNECT_INTERVAL = parseInt(Math.min(Math.max(2, Math.pow(retries, 1.5)), 60))
// 		if (!retries) logger.info(`Closed. Reconnecting...`)

// 		wsTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
// 		retries++
// 	}

// 	ws.onmessage = e => {
// 		const { type, payload } = JSON.parse(e.data)
// 		logger.info('ws:', type, payload)
// 		switch (type) {
// 			case 'connected': {
// 				dispatch(setConnected(payload))
// 				const { parameters } = getState().app.presence
// 				send('set_parameters', { ...parameters, override: false })
// 				break
// 			}
// 			case 'state': {
// 				const { parameters } = payload
// 				if (parameters) {
// 					for (const a in parameters) {
// 						if (a !== 'prompt') {
// 							if (typeof parameters[a] === 'string') {
// 								logger.warn(`parameter ${a} is string, casting`)
// 								parameters[a] = Number(parameters[a])
// 							}
// 						}
// 					}
// 				}

// 				dispatch(setPresence(payload))
// 				break
// 			}
// 			case 'error': {
// 				if (payload.code === CODES.NON_ACTIVE_PUBLISH) {
// 					dispatch(setActive(false))
// 				}
// 				break
// 			}
// 			default:
// 				logger.error('Unknown message type', { type, payload })
// 		}
// 	}
// }

// export const close = () => {
// 	if (ws?.readyState === WebSocket.OPEN) {
// 		ws.close()
// 	}
// }

export default {
	close,
	connect,
	negotiate,
	send,
	setTrack,
}
