import { memo, useEffect, useRef } from 'react'
import useDoubleClick from 'use-double-click'

import { useDispatch, useSelector } from 'react-redux'
import { HEIGHT, HOST, LCM_STATUS, PORT, WIDTH } from '~/lib/constants'
import lcmLive from '~/lib/lcmLive'
import logger from '~/lib/logger'
import store, { selectApp, selectLCMRunning, setLCMStatus, setOriginal, setPanel } from '~/lib/redux'
import Panel from '../Panel'
import styles from './index.module.scss'
import useClasses from '~/lib/useClasses'

let stream
let cint
let videoFrameCallbackId

const THROTTLE = 1000 / 120
let lastMillis = 0

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

const ctx = canvas.getContext('2d')

let video

// const video = document.createElement('video')
// video.setAttribute('style', 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;')
// document.body.appendChild(video)
// video.autoplay = true

async function onFrame(now) {
	if (now - lastMillis < THROTTLE) {
		videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)
		return
	}

	// crop video to WIDTH / HEIGHT proportions before scaling, to preserve ratio:

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
	store.dispatch(setLCMStatus(LCM_STATUS.SEND_FRAME))
	lcmLive.send(window.blob)
}

const onKeyDown = e => {
	const s = store.getState()

	switch (e.code) {
		case 'KeyQ':
			store.dispatch(setPanel(!s.app.panel))
			break
		case 'KeyW':
			logger.error(new Error('Unable to do some shit'))
			break
		case 'KeyV':
			store.dispatch(setOriginal(!s.app.showOriginal))
			break
		default:
			break
	}
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
		return () => {
			logger.log('App unmount')
			window.removeEventListener('keydown', onKeyDown)
			lcmLive.stop()
			if (videoFrameCallbackId && video) video.cancelVideoFrameCallback(videoFrameCallbackId)
			if (stream) {
				const tracks = stream.getTracks()
				tracks.forEach(track => track.stop())
			}
		}
	}, [])

	// stream
	useEffect(() => {
		logger.log('UE camera:', app.camera)
		const getCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: app.camera } })
				video.srcObject = stream
				lcmLive.start()
			} catch (error) {
				logger.error('Error accessing camera:', error)
				lcmLive.stop()
				stream = video.srcObject = null
			}
		}
		getCamera()
	}, [app.camera])

	useEffect(() => {
		console.log('UE lcmRunning:', lcmRunning)
		if (lcmRunning) {
			videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)
		} else if (videoFrameCallbackId) {
			video.cancelVideoFrameCallback(videoFrameCallbackId)
		}
	}, [lcmRunning])

	useEffect(() => {
		console.log('UE fps:', app.fps)
		clearInterval(cint)

		if (lcmRunning) {
			logger.log('start sending images')
			cint = setInterval(sendImage, 1000 / app.fps)
		}

		return () => {
			clearInterval(cint)
			if (video && videoFrameCallbackId) video.cancelVideoFrameCallback(videoFrameCallbackId)
		}
	}, [app.fps, lcmRunning])

	const cls = useClasses(styles.cont, app.panel && styles.panel, app.showOriginal && styles.original)

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
			{/* <div className={styles.image}> */}
			<img
				id='img'
				className={styles.image}
				ref={img}
				style={app.camera === 'user' ? { transform: 'scaleX(-1)' } : null}
				src={
					lcmRunning
						? `http://${HOST}:${PORT}/api/stream/${window.userId}`
						: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
				}
			/>
			{/* </div> */}
		</div>
	)
}

export default memo(App)
