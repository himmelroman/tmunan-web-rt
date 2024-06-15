import { useEffect, useMemo, useCallback, useRef } from 'react'
import useDoubleClick from 'use-double-click'

import { API_URL, HOST, PORT, WIDTH, HEIGHT, LCM_STATUS } from '~/lib/constants'
import styles from './index.module.scss'
import { useDispatch, useSelector } from 'react-redux'
import { selectApp, selectLCMRunning, setPanel } from '~/lib/redux'
import lcmLive from '~/lib/lcmLive'
import Panel from '../Panel'

let stream
let cint
let videoFrameCallbackId

const THROTTLE = 1000 / 120
let lastMillis = 0

const canvas = document.createElement('canvas')
canvas.width = WIDTH
canvas.height = HEIGHT

const ctx = canvas.getContext('2d')

const video = document.createElement('video')

video.autoplay = true

async function onFrame(now) {
	if (now - lastMillis < THROTTLE) {
		videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)
		return
	}
	const videoWidth = video.videoWidth
	const videoHeight = video.videoHeight
	let height0 = videoHeight
	let width0 = videoWidth
	let x0 = 0
	let y0 = 0
	if (videoWidth > videoHeight) {
		width0 = videoHeight
		x0 = (videoWidth - videoHeight) / 2
	} else {
		height0 = videoWidth
		y0 = (videoHeight - videoWidth) / 2
	}

	ctx.drawImage(video, x0, y0, width0, height0, 0, 0, WIDTH, HEIGHT)

	const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 1))
	window.blob = blob

	videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)

	// const body = new FormData()
	// body.append('file', blob)
	// const encodedParams = new URLSearchParams()
	// encodedParams.append('strength', app.parameters.strength)
	// encodedParams.append('ip_adapter_weight', app.parameters.ip_weight)
	// encodedParams.append('prompt', app.parameters.prompt)
	// if (app.parameters.seed > 0) encodedParams.append('seed', app.parameters.seed)

	// const res = await fetch(`${API_URL}?${encodedParams}`, {
	// 	method: 'POST',
	// 	body,
	// 	headers: {
	// 		'Accept-Encoding': 'gzip',
	// 	},
	// })
	// if (res.status > 299) {
	// 	console.log('Error:', res.status)
	// 	return
	// }
	// const blob2 = await res.blob()
	// if (blob2) img.current.src = URL.createObjectURL(blob2)

	// .then(res => {
	// 	console.log('res status', res.status)
	// 	return blob()
	// 	// if (res.status >= 200 && res.status < 300) res.blob()
	// 	// return false
	// })
	// .then(b => {
	// 	if (b) img.current.src = URL.createObjectURL(b)
	// })
	// .catch(e => {
	// 	console.log(e)
	// })
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
		console.log('camera change', app.camera)
		const getCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: app.camera } })
				console.log('stream:', stream)
				video.srcObject = stream

				videoFrameCallbackId = video.requestVideoFrameCallback(onFrame)

				lcmLive.start()
			} catch (error) {
				console.error('Error accessing webcam:', error)
			}
		}

		getCamera()

		return () => {
			lcmLive.stop()
			if (videoFrameCallbackId) video.cancelVideoFrameCallback(videoFrameCallbackId)
			if (stream) {
				const tracks = stream.getTracks()
				tracks.forEach(track => track.stop())
			}
		}
	}, [app.camera])

	const imStyle = useMemo(() => (app.camera === 'user' ? { transform: 'scaleX(-1)' } : null), [app.camera])

	// useEffect(() => {
	// 	console.log('reset sendImage')
	// 	clearInterval(cint)
	// 	cint = setInterval(sendImage, app.parameters.interval)

	// 	return () => {
	// 		clearInterval(cint)
	// 		if (videoFrameCallbackId) videoEl.cancelVideoFrameCallback(videoFrameCallbackId)
	// 	}
	// }, [sendImage, app.parameters.interval])

	// panel
	const panel = useMemo(() => {
		if (app.panel) return <Panel />
		return null
	}, [app.panel])

	const connected = app.lcmStatus !== LCM_STATUS.DISCONNECTED

	return (
		<div className={styles.cont} ref={ref}>
			<div className={styles.image}>
				<img
					id='img'
					className={styles.img0}
					ref={img}
					style={imStyle}
					src={
						connected && app.streamId
							? `http://${HOST}:${PORT}/api/stream/${app.streamId}`
							: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
					}
				/>
			</div>
			{panel}
			{!connected && <div className={styles.status}>Disconnected</div>}
		</div>
	)
}

export default App
