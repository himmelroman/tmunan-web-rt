import { memo, useEffect, useRef } from 'react'
import useDoubleClick from 'use-double-click'

import { useDispatch, useSelector } from 'react-redux'
import { HEIGHT, WIDTH } from '~/lib/constants'
import logger from '~/lib/logger'
import socket from '~/lib/socket'
import store, { selectApp, /* selectIsActive, */ selectFilterString, selectTransformString, setProp, selectIsRunning } from '~/lib/redux'
import Panel from '../Panel'
import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'
// import sleep from '~/lib/sleep'
import chalk from 'chalk'
import sleep from '~/lib/sleep'

// const THROTTLE = 1000 / 30
// let frameId
// let lastMillis = 0

let v_interval

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

const ctx = canvas.getContext('2d')
window.ctx = ctx

let camera_busy
let source_vid
let output_vid

async function drawVideo() {
	// if (now - lastMillis < THROTTLE) {
	// 	frameId = source_vid.requestVideoFrameCallback(drawVideo)
	// 	return
	// }

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

	// const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.96))
	// window.blob = blob
	// frameId = source_vid.requestVideoFrameCallback(drawVideo)
}

// const cancelFrame = () => {
// 	if (!frameId) return
// 	logger.info('Cancelling frame')
// 	if (source_vid) source_vid.cancelVideoFrameCallback(frameId)
// 	frameId = null
// }

const onKeyDown = e => {
	const s = store.getState().app

	if (e.code === 'Escape') {
		if (s.show_panel) store.dispatch(setProp('show_panel', false))
		return
	}

	if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

	switch (e.code) {
		case 'KeyQ':
			store.dispatch(setProp(['show_panel', !s.show_panel]))
			break
		case 'KeyV':
			store.dispatch(setProp(['show_source', !s.show_source]))
			break
		case 'KeyC':
			store.dispatch(setProp(['show_output', !s.show_output]))
			break
		case 'KeyB':
			store.dispatch(setProp(['blackout', s.blackout ? 0 : 1]))
			break
		case 'KeyF':
			document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
			break
		default:
			break
	}
}

const App = () => {
	const ref = useRef()
	// const img = useRef()

	const dispatch = useDispatch()
	const app = useSelector(selectApp)
	// const isActive = useSelector(selectIsActive)
	const isRunning = useSelector(selectIsRunning)
	const filterString = useSelector(selectFilterString)
	const transformString = useSelector(selectTransformString)

	useDoubleClick({
		onDoubleClick: () => {
			if (!app.show_panel) dispatch(setProp(['show_panel', true]))
		},
		ref,
		latency: 180,
	})

	// mnt
	useEffect(() => {
		logger.info('App mounted')
		window.addEventListener('keydown', onKeyDown)

		return () => {
			logger.info('App unmounted')
			window.removeEventListener('keydown', onKeyDown)
			clearInterval(v_interval)
			// cancelFrame()
			if (source_vid?.srcObject) {
				const tracks = source_vid.srcObject.getTracks()
				tracks.forEach(track => track.stop())
				source_vid.srcObject = null
			}
			if (window.stream) {
				const tracks = window.stream.getTracks()
				tracks.forEach(track => track.stop())
				window.stream = null
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
			if (source_vid.srcObject) {
				const tracks = source_vid.srcObject.getTracks()
				tracks.forEach(track => track.stop())
				source_vid.srcObject = null
				// fix for mobile devices
				await sleep(0.6)
			}

			logger.info(`Getting camera stream...`)

			if (camera_busy) {
				logger.warn('Camera busy')
				return
			}
			camera_busy = true
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: app.camera,
					width: 9999,
				},
			})
			camera_busy = false
			source_vid.srcObject = stream

			logger.info('Got camera stream', stream)
		}
		getCamera()
	}, [app.camera])

	useEffect(() => {
		logger.info(`isRunning > ${isRunning ? chalk.greenBright('True') : chalk.redBright('False')}`)
		clearInterval(v_interval)
		if (window.stream) {
			logger.info('Stopping stream')
			const tracks = window.stream.getTracks()
			tracks.forEach(track => track.stop())
			window.stream = null
		}

		if (isRunning) {
			logger.info('Starting stream')
			v_interval = setInterval(drawVideo, 1000 / app.fps)
			window.stream = canvas.captureStream(app.fps)
			socket.replaceTrack(window.stream)
		}
	}, [isRunning, app.fps])

	useEffect(() => {
		source_vid.style.filter = filterString
		ctx.filter = filterString
	}, [filterString])

	useEffect(() => {
		// const { string, scales } = transform
		// logger.info(`Transform > ${string}`)
		source_vid.style.transform = transformString
		// ctx.translate(scales[0] < 0 ? WIDTH : 0, 0)

		// const sx = prevScales[0] / scales[0]
		// const sy = prevScales[1] / scales[1]

		// console.log('scales', prevScales, scales, sx, sy)

		// ctx.scale(sx, sy)
		// drawVideo()

		// prevScales[0] = scales[0]
		// prevScales[1] = scales[1]
		output_vid.style.transform = transformString
	}, [transformString])

	// useEffect(() => {
	// 	if (running) {
	// 		frameId = video.requestVideoFrameCallback(onFrame)
	// 	} else {
	// 		cancelFrame('disconnected')
	// 	}
	// }, [running])

	// useEffect(() => {
	// 	clearInterval(cint)
	// 	if (running) cint = setInterval(sendImage, 1000 / app.fps)

	// 	return () => {
	// 		clearInterval(cint)
	// 	}
	// }, [app.fps, running])

	const cls = useClasses(styles.cont, app.show_panel && styles.show_panel, app.show_source && styles.show_source, app.show_output && styles.show_output)

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
					}}
				/>
				<video
					id='output'
					autoPlay
					className={`${styles.video} ${styles.output}`}
					ref={r => {
						output_vid = r
						window.output_vid = r
					}}
				/>
			</div>
		</div>
	)
}

export default memo(App)
