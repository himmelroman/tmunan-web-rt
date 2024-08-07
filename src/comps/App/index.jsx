import { memo, useEffect, useRef } from 'react'
import useDoubleClick from 'use-double-click'

import { useDispatch, useSelector } from 'react-redux'
import { HEIGHT, HOST, PORT, PROTOCOL, WIDTH } from '~/lib/constants'
import logger from '~/lib/logger'
import socket from '~/lib/socket'
import store, { selectApp, setShowSource, setShowPanel, setShowOutput, setCameras, selectRunning, setShowClients } from '~/lib/redux'
import Panel from '../Panel'
import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'
import sleep from '~/lib/sleep'

let stream
let cint
let frameId

const THROTTLE = 1000 / 60
let lastMillis = 0

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

const ctx = canvas.getContext('2d')
let video

async function getCameras() {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices()
		const cameras = devices.filter(device => device.kind === 'videoinput').map(device => device.label)
		store.dispatch(setCameras(cameras))
		return true
	} catch (error) {
		logger.error('Error getting cameras', error)
		return false
	}
}

async function onFrame(now) {
	if (now - lastMillis < THROTTLE) {
		frameId = video.requestVideoFrameCallback(onFrame)
		return
	}

	const vwidth = video.videoWidth
	const vheight = video.videoHeight
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

	ctx.drawImage(video, x, y, width, height, 0, 0, WIDTH, HEIGHT)

	const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
	window.blob = blob

	frameId = video.requestVideoFrameCallback(onFrame)
}

const sendImage = () => {
	socket.send(window.blob)
}

const onKeyDown = e => {
	if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
	const s = store.getState()

	switch (e.code) {
		case 'KeyQ':
			store.dispatch(setShowPanel(!s.app.showPanel))
			break
		case 'Escape':
			if (s.app.showPanel) store.dispatch(setShowPanel(false))
			break
		case 'KeyV':
			store.dispatch(setShowSource(!s.app.showSource))
			break
		case 'KeyK':
			store.dispatch(setShowClients(!s.app.showClients))
			break
		case 'KeyC':
			store.dispatch(setShowOutput(!s.app.showOutput))
			break
		case 'KeyF':
			document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
			break
		default:
			break
	}
}

const cancelFrame = reason => {
	if (!video || !frameId) return
	logger.info('Cancelling frame', reason)
	video.cancelVideoFrameCallback(frameId)
	frameId = null
}

const App = () => {
	const ref = useRef()
	const img = useRef()

	const dispatch = useDispatch()
	const app = useSelector(selectApp)
	const running = useSelector(selectRunning)

	useDoubleClick({
		onDoubleClick: () => {
			if (!app.showPanel) dispatch(setShowPanel(true))
		},
		ref,
		latency: 180,
	})

	// mnt
	useEffect(() => {
		logger.info('App mount')
		window.addEventListener('keydown', onKeyDown)
		getCameras()

		return () => {
			logger.info('App unmount')
			window.removeEventListener('keydown', onKeyDown)
			socket.close()
			cancelFrame('app unmount')
			if (stream) {
				const tracks = stream.getTracks()
				tracks.forEach(track => track.stop())
			}
		}
	}, [])

	// camera changes
	useEffect(() => {
		const getCamera = async () => {
			if (stream) {
				stream.getTracks().forEach(track => track.stop())
				logger.debug('Giving 0.75 seconds for camera to stop...')
				await sleep(0.75)
			}
			if (!app.camera) return
			try {
				logger.debug('Getting camera stream...')
				stream = await navigator.mediaDevices.getUserMedia({
					video: {
						label: app.camera,
						width: 9999,
					},
				})
				logger.debug('Got camera stream', stream)
				video.srcObject = stream
			} catch (error) {
				stream = video.srcObject = null
				logger.error('Error getting camera', error)
			}
		}
		getCamera()
	}, [app.camera])

	useEffect(() => {
		if (running) {
			frameId = video.requestVideoFrameCallback(onFrame)
		} else {
			cancelFrame('disconnected')
		}
	}, [running])

	useEffect(() => {
		clearInterval(cint)
		if (running) cint = setInterval(sendImage, 1000 / app.fps)

		return () => {
			clearInterval(cint)
		}
	}, [app.fps, running])

	const cls = useClasses(styles.cont, app.showPanel && styles.panel, app.showSource && styles.show_source, app.showOutput && styles.show_output, app.flipped && styles.flipped)

	return (
		<div className={cls} ref={ref}>
			{app.showPanel && <Panel />}
			<video
				id='video'
				autoPlay
				className={styles.video}
				ref={r => {
					video = r
				}}
			/>
			{app.showOutput && (
				<img
					id='img'
					className={styles.image}
					ref={img}
					src={
						app.connected
							? `${PROTOCOL}://${HOST}${PORT ? ':' + PORT : ''}/api/stream`
							: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
					}
				/>
			)}
		</div>
	)
}

export default memo(App)
