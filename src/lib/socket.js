import * as Ably from 'ably'
import chalk from 'chalk'
import debounce from 'debounce'

import {
	ABLY_CHANNEL,
	ABLY_TOKEN,
	CONNECTION_STATES,
	MOBILE_CONTROL,
	NAME,
	OFFLINE,
	SCTP_CAUSE_CODES,
} from './constants'
import logger from './logger'
import store, { setAblyState, setParameters, setPresence, setRTCState } from './redux'
import sleep from './sleep'

const { dispatch, getState } = store

// PC

let pc
let dc

let rcTimeout
let retries = 0

// Ably

const ably = new Ably.Realtime({
	key: ABLY_TOKEN,
	recover: (last, cb) => {
		cb(true)
	},
})

const channel = ably.channels.get(ABLY_CHANNEL)

if (!OFFLINE) {
	ably.connection.on(change => {
		store.dispatch(setAblyState(change.current))
		if (change.current === CONNECTION_STATES.CONNECTED) {
			logger.info(chalk.greenBright('Ably connected'))
			if (!pc) initiatePeerConnection()
		} else if (change.current === CONNECTION_STATES.DISCONNECTED) {
			logger.info(chalk.redBright('Ably disconnected'))
		}
	})

	channel.subscribe('answer', async answer => {
		answer = JSON.parse(answer.data)
		if (answer.name !== NAME) return
		logger.info(chalk.greenBright('Answer received'), answer)
		await sleep(0.3)
		pc.setRemoteDescription(answer)
	})
}

// eslint-disable-next-line no-unused-vars
const publishOffer = () => {
	logger.info('Publishing offer...')
	const offer = pc.localDescription

	channel.publish(
		'offer',
		JSON.stringify({
			name: NAME,
			output: !MOBILE_CONTROL,
			type: offer.type,
			sdp: offer.sdp,
		})
	)
}

// WebRTC

// eslint-disable-next-line no-unused-vars
// const postOffer = () => {
// 	logger.info('Posting offer...')
// 	const offer = pc.localDescription
// 	const query = `${BASE_URL}/offer?name=${NAME}&output=true`
// 	logger.debug('Sending offer to', query)

// 	fetch(query, {
// 		body: JSON.stringify({
// 			type: offer.type,
// 			sdp: offer.sdp,
// 			name: NAME,
// 		}),
// 		headers: {
// 			'Content-Type': 'application/json',
// 		},
// 		method: 'POST',
// 	})
// 		.then(res => res.json())
// 		.then(answer => {
// 			logger.info(`${chalk.greenBright('Answer received')} setting remote description`, answer)
// 			pc.setRemoteDescription(answer)
// 		})
// 		.catch(e => {
// 			logger.error('Failed to connect', e)
// 			reconnect()
// 		})
// }

export const initiatePeerConnection = async () => {
	logger.info(`Initiating peer connection...`)

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
		logger.debug(`ICE ${c(s)}`)
		store.dispatch(setRTCState(s))
		if (s === 'disconnected') reconnect()
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
			.then(publishOffer)
			.catch(e => {
				logger.error('Failed to create offer', e)
			})
	}

	// create data channel
	createDataChannel()

	pc.addTransceiver('video')
}

export const send = (type, payload) => {
	if (dc?.readyState === 'open') {
		if (typeof type === 'string') dc.send(JSON.stringify({ type, payload }))
		else dc.send(type)
	}
}

export const debouncedSend = debounce(send, 100)

export const replaceTrack = async stream => {
	logger.info('Replacing track')
	const sender = pc.getSenders()[0]
	const track = stream.getVideoTracks()[0]
	if ('contentHint' in track) {
		track.contentHint = 'detail'
	}
	sender.replaceTrack(track)
}

// Transport: REST + DataChannel

const reconnect = () => {
	clearTimeout(rcTimeout)
	let RECONNECT_INTERVAL = parseInt(Math.min(Math.max(2, Math.pow(retries, 1.5)), 60))
	if (retries === 5) RECONNECT_INTERVAL += 15
	else if (retries === 20) RECONNECT_INTERVAL += 30
	logger.debug(`Reconnecting in ${RECONNECT_INTERVAL}s...`)

	rcTimeout = setTimeout(initiatePeerConnection, RECONNECT_INTERVAL * 1000)
	retries++
}

const createDataChannel = () => {
	dc = pc.createDataChannel('data')

	dc.onopen = () => {
		logger.info(chalk.greenBright('Data channel opened'))
		retries = 0
		const { parameters } = getState().app.presence
		send('parameters', { ...parameters, override: false })
	}

	dc.onmessage = e => {
		const { type, payload } = JSON.parse(e.data)
		logger.info('Data channel message', { type, payload })
		switch (type) {
			case 'presence': {
				dispatch(setPresence(payload))
				break
			}
			case 'parameters': {
				if (window.mouse_down || window.active_range) {
					window.pending_params = payload
				} else {
					dispatch(setParameters(payload))
				}
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
				if (error.sctpCauseCode < SCTP_CAUSE_CODES.length) {
					console.error('	SCTP failure: ', error.sctpCauseCode, SCTP_CAUSE_CODES[error.sctpCauseCode])
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
}

export default {
	close,
	initiatePeerConnection,
	send,
	debouncedSend,
	replaceTrack,
}
