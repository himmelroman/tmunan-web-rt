import { memo, useEffect, useRef } from 'react'
import useDoubleClick from 'use-double-click'

import { useDispatch, useSelector } from 'react-redux'
import { HEIGHT, HOST, PORT, WIDTH } from '~/lib/constants'
import lcmLive from '~/lib/lcmLive'
import logger from '~/lib/logger'
import store, { selectApp, selectLCMRunning, setShowSource, setPanel, setShowOutput, setCameras } from '~/lib/redux'
import Panel from '../Panel'
import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'
import sleep from '~/lib/sleep'

let stream
let cint
let videoFrameCallbackId

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
		console.error('Error getting cameras:')
		console.log(error)
		return false
	}
}

async function onFrame(now) {
	if (now - lastMillis < THROTTLE) {
		videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)
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

	videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)
}

const sendImage = () => {
	lcmLive.send(window.blob)
}

const onKeyDown = e => {
	if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
	const s = store.getState()

	switch (e.code) {
		case 'KeyQ':
			store.dispatch(setPanel(!s.app.panel))
			break
		case 'Escape':
			if (s.app.panel) store.dispatch(setPanel(false))
			break
		case 'KeyV':
			store.dispatch(setShowSource(!s.app.showSource))
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
	if (!video || !videoFrameCallbackId) return
	console.log('cancelling frame because:', reason)
	video.cancelVideoFrameCallback(videoFrameCallbackId)
	videoFrameCallbackId = null
}

const App = () => {
	const ref = useRef()
	const img = useRef()

	const dispatch = useDispatch()
	const app = useSelector(selectApp)
	const lcmRunning = useSelector(selectLCMRunning)

	useDoubleClick({
		onDoubleClick: () => {
			if (!app.panel) dispatch(setPanel(true))
		},
		ref,
		latency: 180,
	})

	// mnt
	useEffect(() => {
		logger.log('App mount')
		window.addEventListener('keydown', onKeyDown)
		getCameras()

		return () => {
			logger.log('App unmount')
			window.removeEventListener('keydown', onKeyDown)
			lcmLive.stop()
			cancelFrame('app unmount')
			if (stream) {
				const tracks = stream.getTracks()
				tracks.forEach(track => track.stop())
			}
		}
	}, [])

	// stream
	useEffect(() => {
		logger.log('UE camera', app.camera)
		const getCamera = async () => {
			if (stream) {
				stream.getTracks().forEach(track => track.stop())
				console.log('giving 0.75 seconds for camera to stop...')
				await sleep(0.75)
			}
			if (!app.camera) return
			try {
				console.log('getting camera stream...')
				stream = await navigator.mediaDevices.getUserMedia({
					video: {
						label: app.camera,
						width: 9999,
					},
				})
				console.log('got camera', stream)
				video.srcObject = stream
				lcmLive.start()
			} catch (error) {
				lcmLive.stop()
				stream = video.srcObject = null
				console.error('Error accessing camera:')
				console.log(error)
			}
		}
		getCamera()

		// test
	}, [app.camera])

	useEffect(() => {
		console.log('UE lcmRunning', lcmRunning)
		if (lcmRunning) {
			videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)
		} else {
			cancelFrame('lcmRunning false')
		}
	}, [lcmRunning])

	useEffect(() => {
		console.log('UE fps', app.fps)
		clearInterval(cint)

		if (lcmRunning) {
			cint = setInterval(sendImage, 1000 / app.fps)
		}

		return () => {
			clearInterval(cint)
		}
	}, [app.fps, lcmRunning])

	const cls = useClasses(styles.cont, app.panel && styles.panel, app.showSource && styles.show_source, app.showOutput && styles.show_output, app.camera === 'user' && styles.user)

	return (
		<div className={cls} ref={ref}>
			{app.panel && <Panel />}
			<video
				id='video'
				autoPlay
				className={styles.video}
				ref={r => {
					video = r
				}}
			/>
			<img
				id='img'
				className={styles.image}
				ref={img}
				src={
					lcmRunning
						? `https://${HOST}${PORT ? ':' + PORT : ''}/api/stream/${window.userId}`
						: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
				}
			/>
		</div>
	)
}

export default memo(App)
