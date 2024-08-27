/**
 *
 * App
 *
 */
import chalk from 'chalk'
import gsap from 'gsap'
import { memo, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useDoubleClick from 'use-double-click'

import { HEIGHT, IS_CONTROL, RANGE_KEYS, WIDTH } from '~/lib/constants'
import logger from '~/lib/logger'
import store, {
	defaultState,
	selectApp,
	selectFilterString,
	selectIsRunning,
	selectTransformString,
	setActiveRange,
	setCameraSettings,
	setLocalProp,
} from '~/lib/redux'
import socket from '~/lib/socket'
import useClasses from '~/lib/useClasses'
import Panel from '../Panel'
import styles from './index.module.scss'
import sleep from '~/lib/sleep'
// import Segmenter from '~/lib/Segmenter'

import '~/lib/midi'

// gsap

window.gsap = gsap
gsap.ticker.fps = 10

let draw_interval

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT
window.canvas = canvas

const ctx = canvas.getContext('2d', {
	willReadFrequently: true,
})
window.ctx = ctx

let camera_busy
let source_vid

const transformRef = { ...defaultState.parameters.client.transform }

window.pressed = {}

async function drawVideo() {
	const vwidth = source_vid.videoWidth
	const vheight = source_vid.videoHeight
	let width
	let height
	let x
	let y

	if (vwidth / vheight > WIDTH / HEIGHT) {
		width = vheight * (WIDTH / HEIGHT)
		height = vheight
		x = (vwidth - width) / 2
		y = 0
	} else {
		width = vwidth
		height = vwidth * (HEIGHT / WIDTH)
		x = 0
		y = (vheight - height) / 2
	}

	ctx.drawImage(source_vid, x, y, width, height, 0, 0, WIDTH, HEIGHT)
}

export const stopOutputStream = () => {
	if (window.output_stream) {
		logger.info('Stopping outgoing stream')
		const tracks = window.output_stream.getTracks()
		tracks.forEach(track => track.stop())
		window.output_stream = null
	}
}
window.stopStream = stopOutputStream

const onKeyDown = e => {
	if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) {
		if (!e.target.dataset.noblur && (e.code === 'Enter' || e.code === 'Escape')) {
			e.target.blur()
		}
		return
	}

	const { app } = store.getState()

	if (/Key\w/.test(e.code)) {
		const param = RANGE_KEYS[e.code]
		if (app.active_range !== param) {
			store.dispatch(setActiveRange(param))
		}
	}

	if (e.ctrlKey) {
		return
	}

	switch (e.code) {
		case 'KeyQ':
			if (!IS_CONTROL) store.dispatch(setLocalProp(['show_panel', !app.show_panel]))
			break
		case 'Digit1':
			store.dispatch(setLocalProp(['show_source', !app.show_source]))
			break
		case 'Digit2':
			store.dispatch(setLocalProp(['show_output', !app.show_output]))
			break
		case 'KeyF':
			e.preventDefault()
			document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
			break
		default:
			break
	}
}

const onKeyUp = e => {
	const s = store.getState().app
	if (s.active_range && s.active_range === RANGE_KEYS[e.code]) {
		store.dispatch(setActiveRange(null))
	}
}

// eslint-disable-next-line no-unused-vars
const focusChange = ({ type }) => {
	console.log(type, document.activeElement)
}

const App = () => {
	const ref = useRef()
	// const img = useRef()

	const dispatch = useDispatch()
	const app = useSelector(selectApp)
	const clientParams = app.parameters.client
	const isRunning = useSelector(selectIsRunning)
	const filterString = useSelector(selectFilterString)
	const transformString = useSelector(selectTransformString)

	useDoubleClick({
		onDoubleClick: () => {
			if (!app.show_panel) dispatch(setLocalProp(['show_panel', true]))
		},
		ref,
		latency: 180,
	})

	// mnt
	useEffect(() => {
		logger.info('App mounted')
		window.addEventListener('keydown', onKeyDown, true)
		window.addEventListener('keyup', onKeyUp, true)
		// window.addEventListener('wheel', onWheel, { passive: false })

		// window.addEventListener('focusin', focusChange)

		return () => {
			logger.info('App unmounted')
			window.removeEventListener('keydown', onKeyDown, true)
			window.removeEventListener('keydown', onKeyUp, true)
			// window.removeEventListener('wheel', onWheel)
			clearInterval(draw_interval)
			if (source_vid?.srcObject) {
				const tracks = source_vid.srcObject.getTracks()
				tracks.forEach(track => track.stop())
				source_vid.srcObject = null
			}
			if (window.output_stream) {
				const tracks = window.output_stream.getTracks()
				tracks.forEach(track => track.stop())
				window.output_stream = null
			}
		}
	}, [])

	useEffect(() => {
		if (app.camera === window.camera) {
			logger.debug('Camera > no change')
		}
		logger.info(`Camera > ${chalk.cyan(window.cmap[app.camera])}`)
		window.camera = app.camera

		const getCamera = async () => {
			// turn off previous camera
			// segmenter.running = false
			if (source_vid.srcObject) {
				const tracks = source_vid.srcObject.getTracks()
				tracks.forEach(track => track.stop())
				source_vid.srcObject = null
				// fix for mobile devices
				await sleep(0.6)
			}

			if (camera_busy) {
				logger.warn('Camera busy')
				return
			}

			if (!app.camera || app.camera === 'none') return

			logger.info(`Getting camera stream...`)

			camera_busy = true
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: app.camera,
					width: WIDTH,
					height: HEIGHT,
				},
			})
			camera_busy = false
			source_vid.srcObject = stream

			source_vid.onloadeddata = () => {
				logger.info('Camera stream loaded')
				// segmenter.running = true
			}

			const track = stream.getVideoTracks()[0]
			window.camera_track = track

			const capabilities = track.getCapabilities()
			logger.info('Capabilities', JSON.parse(JSON.stringify(capabilities)))
			const settings = track.getSettings()
			logger.info('Settings', JSON.parse(JSON.stringify(settings)))

			dispatch(setCameraSettings({ capabilities, settings }))
		}
		getCamera()
	}, [app.camera])

	useEffect(() => {
		logger.info(`isRunning > ${isRunning ? chalk.greenBright('True') : chalk.redBright('False')}`)
		clearInterval(draw_interval)
		stopOutputStream()

		if (isRunning) {
			logger.info('Starting stream')
			draw_interval = setInterval(drawVideo, 1000 / clientParams.fps)
			window.output_stream = canvas.captureStream(clientParams.fps)
			socket.replaceTrack(window.output_stream)
		}
	}, [isRunning, clientParams.fps])

	useEffect(() => {
		const duration = clientParams.transition_duration
		source_vid.style.filter = filterString
		gsap.killTweensOf(ctx)
		gsap.to(ctx, { duration, filter: filterString })
	}, [filterString, clientParams.transition_duration])

	useEffect(() => {
		source_vid.style.transform = transformString
		if (transformRef.flip_x !== clientParams.transform.flip_x) {
			console.log(chalk.yellow('Flipping X'), transformRef.flip_x, '>', clientParams.transform.flip_x)
			ctx.translate(WIDTH, 0)
			ctx.scale(-1, 1)
		}
		if (transformRef.flip_y !== clientParams.transform.flip_y) {
			ctx.translate(0, HEIGHT)
			ctx.scale(1, -1)
		}
		transformRef.flip_x = clientParams.transform.flip_x
		transformRef.flip_y = clientParams.transform.flip_y
	}, [transformString, clientParams.transform])

	const cls = useClasses(
		styles.cont,
		app.show_panel && styles.show_panel,
		app.show_source && styles.show_source,
		app.show_output && styles.show_output
	)

	return (
		<div className={cls} ref={ref}>
			{app.show_panel && <Panel />}
			<div className={styles.view}>
				<video
					id='source'
					autoPlay
					className={`${styles.video} ${styles.source}`}
					ref={r => {
						source_vid = r
						window.source_vid = r
						// if (r && !segmenter) {
						// 	console.log('Creating segmenter...')
						// 	segmenter = new Segmenter(r, ctx)
						// 	window.segmenter = segmenter
						// }
					}}
				/>
				<video
					id='output'
					autoPlay
					className={`${styles.video} ${styles.output}`}
					ref={r => {
						window.output_vid = r
					}}
				/>
			</div>
		</div>
	)
}

export default memo(App)
