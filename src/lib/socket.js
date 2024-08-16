import chalk from 'chalk'
import { /* CODES, SOCKET_URL, */ BASE_URL, NAME } from './constants'
import logger from './logger'
import store, { setConnected, setPresence } from './redux'

const { dispatch, getState } = store

// let ws
let pc
let dc

let rcTimeout
let retries = 0

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
	clearTimeout(rcTimeout)
	dispatch(setConnected(false))

	let RECONNECT_INTERVAL = parseInt(Math.min(Math.max(2, Math.pow(retries, 1.5)), 60))
	if (retries === 5) RECONNECT_INTERVAL += 15
	else if (retries === 20) RECONNECT_INTERVAL += 30
	logger.debug(`Reconnecting in ${RECONNECT_INTERVAL}s...`)

	rcTimeout = setTimeout(connect, RECONNECT_INTERVAL * 1000)
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
		const s = pc.iceConnectionState
		const c = s === 'connected' ? chalk.greenBright : s === 'disconnected' ? chalk.redBright : chalk.white
		logger.debug(`ICE Connection state > ${c(s)}`)
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
				const offer = pc.localDescription
				// const { show_output } = getState().app
				const query = `${BASE_URL}/offer?name=${NAME}&output=true`

				logger.debug('Sending offer to', query)

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
						logger.info(`${chalk.greenBright('Answer received')} setting remote description`, answer)
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
		if (error.sctpCauseCode === 12) return
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

	pc.addTransceiver('video')
	console.log('Added transciever', pc.getTransceivers())
}

export const replaceTrack = async stream => {
	logger.info('Replacing track')
	const sender = pc.getSenders()[0]
	const track = stream.getVideoTracks()[0]
	if ('contentHint' in track) {
		track.contentHint = 'detail'
	}
	sender.replaceTrack(track)
}

// Add, remove or replace track
// export const setTrack = isActive => {
// 	const { stream } = window
// 	const stream_present = !!stream
// 	logger.info(`Set outgoing track > ${isActive ? chalk.greenBright('ON') : chalk.redBright('OFF')} ${stream_present ? '' : chalk.redBright('NO STREAM')}`)

// 	const sender = pc.getSenders()[0]
// 	if (isActive) {
// 		logger.info('\tReplacing track')
// 		if (stream) sender.replaceTrack(stream.getVideoTracks()[0])
// 		else {
// 			sender.replaceTrack(stream.getVideoTracks()[0])
// 		}
// 	} else {
// 		logger.info('\tRemoving track')
// 		pc.removeTrack(sender)
// 		return
// 	}
// }

export default {
	close,
	connect,
	send,
	replaceTrack,
}
