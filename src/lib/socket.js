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

export const reconnect = () => {
	clearTimeout(wsTimeout)
	dispatch(setConnected(false))

	const RECONNECT_INTERVAL = parseInt(Math.min(Math.max(2, Math.pow(retries, 1.5)), 60))
	logger.debug(`Reconnecting in ${RECONNECT_INTERVAL}s...`)

	wsTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
	retries++
}

export const connect = async () => {
	logger.info(`Creating peer connection...`)

	pc = new RTCPeerConnection({
		sdpSemantics: 'unified-plan',
		// iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
	})

	window.pc = pc

	pc.onicegatheringstatechange = () => {
		logger.debug(`ICE Gathering state > ${chalk.cyanBright(pc.iceGatheringState)}`)
	}

	pc.oniceconnectionstatechange = () => {
		logger.debug(`ICE Connection state > ${chalk.cyanBright(pc.iceConnectionState)}`)
		if (pc.iceConnectionState === 'disconnected') {
			reconnect()
		}
	}

	pc.onsignalingstatechange = () => {
		logger.debug(`Signaling state > ${chalk.cyanBright(pc.signalingState)}`)
	}

	pc.ontrack = e => {
		logger.info(chalk.blueBright('On track'), e)
		window.output_vid.srcObject = e.streams[0]
	}

	/* 
	
	
	*/

	pc.onnegotiationneeded = () => {
		logger.debug('Creating offer...')
		pc.createOffer()
			.then(offer => {
				logger.info('Setting local description...')
				return pc.setLocalDescription(offer)
			})
			.then(
				() =>
					new Promise(resolve => {
						if (pc.iceGatheringState === 'complete') {
							resolve()
						} else {
							logger.warn('Waiting for ICE gathering to complete...')
							const checkState = () => {
								if (pc.iceGatheringState === 'complete') {
									pc.removeEventListener('icegatheringstatechange', checkState)
									resolve()
								}
							}
							pc.addEventListener('icegatheringstatechange', checkState)
						}
					})
			)
			.then(() => {
				logger.debug('Sending offer...')
				const offer = pc.localDescription

				let query = `${BASE_URL}/offer?name=${NAME}`
				if (getState().app.show_output) query += '&output=true'

				fetch(query, {
					body: JSON.stringify({
						type: offer.type,
						sdp: offer.sdp,
						name: NAME,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
					method: 'POST',
				})
					.then(res => res.json())
					.then(answer => {
						logger.info(`${chalk.greenBright('Answer received.')} Setting remote description`, answer)
						pc.setRemoteDescription(answer)
					})
					.catch(e => {
						logger.error('Failed to connect', e)
						reconnect()
					})
			})
			.catch(e => {
				logger.error('Failed to create offer', e)
			})
	}

	// create data channel

	dc = pc.createDataChannel('data')

	dc.onopen = () => {
		logger.info(chalk.greenBright('Data channel opened'))
		dispatch(setConnected(true))
		retries = 0
	}

	dc.onmessage = e => {
		const { type, payload } = JSON.parse(e.data)
		logger.info('Data channel message', { type, payload })
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
		logger.info(chalk.redBright('Data channel closed'))
	}

	dc.onerror = ({ error }) => {
		// if (!retries)
		logger.warn('Data channel error:', error.message)

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

	// if (should_send) {
	// 	logger.info('Sending flag true, getting stream and adding track')
	// 	const { camera } = getState().app
	// 	window.camera = camera

	// 	let stream = window.stream
	// 	if (!stream) {
	// 		stream = await navigator.mediaDevices.getUserMedia({
	// 			video: {
	// 				deviceId: camera,
	// 				width: 9999,
	// 			},
	// 		})
	// 		window.stream = stream
	// 		window.source_vid.srcObject = stream
	// 	}

	// 	logger.info('Adding track')
	// 	pc.addTrack(stream.getVideoTracks()[0], stream)
	// }
}

// Add, remove or replace track
export const setTrack = on => {
	const { stream } = window
	const stream_present = !!stream
	logger.info(`Set outgoing track > ${on ? chalk.greenBright('ON') : chalk.redBright('OFF')} | stream: ${stream_present}`)

	should_send = on && stream_present
	const sender = pc.getSenders()[0]
	if (sender) {
		if (should_send) {
			logger.info('\tReplacing track')
			sender.replaceTrack(stream.getVideoTracks()[0])
		} else {
			logger.info('\tRemoving track')
			pc.removeTrack(sender)
			return
		}
	} else if (should_send) {
		const track = stream.getVideoTracks()[0]
		logger.info('\tAdding track')
		pc.addTrack(track, stream)
	}
}

window.setTrack = setTrack

export default {
	close,
	connect,
	send,
	setTrack,
}
