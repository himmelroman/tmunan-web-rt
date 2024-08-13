import { memo, useEffect, useRef } from 'react'
import useDoubleClick from 'use-double-click'

import { useDispatch, useSelector } from 'react-redux'
import { HEIGHT, WIDTH } from '~/lib/constants'
import logger from '~/lib/logger'
import socket from '~/lib/socket'
import store, { selectApp, setShowSource, setShowPanel, setShowOutput, selectRunning, setShowClients, selectIsActive } from '~/lib/redux'
import Panel from '../Panel'
import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'
import sleep from '~/lib/sleep'
import chalk from 'chalk'

// let cint
let frameId

const THROTTLE = 1000 / 60
let lastMillis = 0

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

const ctx = canvas.getContext('2d')

window.ctx = ctx

// async function onFrame(now) {
// 	if (now - lastMillis < THROTTLE) {
// 		frameId = source.requestVideoFrameCallback(onFrame)
// 		return
// 	}

// 	const vwidth = source.videoWidth
// 	const vheight = source.videoHeight
// 	let width
// 	let height
// 	let x
// 	let y

// 	if (vwidth / vheight > WIDTH / HEIGHT) {
// 		width = vheight * (WIDTH / HEIGHT)
// 		height = vheight
// 		x = (vwidth - width) / 2
// 		y = 0
// 	} else {
// 		width = vwidth
// 		height = vwidth * (HEIGHT / WIDTH)
// 		x = 0
// 		y = (vheight - height) / 2
// 	}

// 	ctx.drawImage(source, x, y, width, height, 0, 0, WIDTH, HEIGHT)

// 	const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.96))
// 	window.blob = blob

// 	frameId = source.requestVideoFrameCallback(onFrame)
// }

const cancelFrame = reason => {
	if (!window.src_video || !frameId) return
	logger.info('Cancelling frame', reason)
	window.src_video.cancelVideoFrameCallback(frameId)
	frameId = null
}

const onKeyDown = e => {
	const s = store.getState()

	if (e.code === 'Escape') {
		if (s.app.show_panel) store.dispatch(setShowPanel(false))
		return
	}

	if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

	switch (e.code) {
		case 'KeyQ':
			store.dispatch(setShowPanel(!s.app.show_panel))
			break
		case 'KeyV':
			store.dispatch(setShowSource(!s.app.show_source))
			break
		case 'KeyK':
			store.dispatch(setShowClients(!s.app.show_clients))
			break
		case 'KeyC':
			store.dispatch(setShowOutput(!s.app.show_output))
			break
		case 'KeyF':
			document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
			break
		default:
			break
	}
}

const getStream = async camera => {
	if (camera === window.camera) return
	window.camera = camera
	logger.info(`getStream ${chalk.blueBright(window.cmap[camera])}`)

	if (window.camera_busy) {
		console.log('%cCamera busy', 'color:orange')
		return
	}
	if (!camera) {
		console.log('%cNo camera', 'color:orange')
		if (window.stream) {
			window.stream.getTracks().forEach(track => track.stop())
			window.stream = null
		}
		return
	}

	window.camera_busy = true
	const stream = await navigator.mediaDevices.getUserMedia({
		video: {
			deviceId: camera,
			width: 9999,
		},
	})
	window.camera_busy = false
	window.source_vid.srcObject = stream
	window.stream = stream

	const state = store.getState()
	const isActive = selectIsActive(state)

	console.log('got stream:', stream, isActive)

	if (stream && isActive) {
		socket.setTrack(stream)
	} else {
		socket.setTrack()
	}
}

const App = () => {
	const ref = useRef()
	// const img = useRef()

	const dispatch = useDispatch()
	const app = useSelector(selectApp)
	const running = useSelector(selectRunning)
	const isActive = useSelector(selectIsActive)

	useDoubleClick({
		onDoubleClick: () => {
			if (!app.show_panel) dispatch(setShowPanel(true))
		},
		ref,
		latency: 180,
	})

	// mnt
	useEffect(() => {
		logger.info('App mount')
		window.addEventListener('keydown', onKeyDown)

		return () => {
			logger.info('App unmount')
			window.removeEventListener('keydown', onKeyDown)
			cancelFrame('app unmount')
			if (window.stream) {
				const tracks = window.stream.getTracks()
				tracks.forEach(track => track.stop())
			}
		}
	}, [])

	useEffect(() => {
		console.log('UE, camera:', app.camera)
		getStream(app.camera)
	}, [app.camera])

	useEffect(() => {
		console.log('UE isActive', isActive)
		if (isActive) {
			if (window.stream) {
				console.log('setting track')
				socket.setTrack(window.stream)
			} else {
				console.warn('No stream found')
			}
		} else {
			console.log('removing track')
			socket.setTrack()
		}
	}, [isActive])

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

	const cls = useClasses(styles.cont, app.show_panel && styles.panel, app.show_source && styles.show_source, app.show_output && styles.show_output)

	return (
		<div className={cls} ref={ref}>
			{app.show_panel && <Panel />}
			<video
				id='source'
				autoPlay
				className={styles.source}
				ref={r => {
					window.source_vid = r
				}}
			/>
			<video
				id='output'
				autoPlay
				className={styles.output}
				ref={r => {
					window.output_vid = r
				}}
			/>
			{/* {app.show_output && (
				<img
					id='img'
					className={styles.image}
					ref={img}
					src={app.connected ? IMG_URL : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='}
				/>
			)} */}
		</div>
	)
}

export default memo(App)
