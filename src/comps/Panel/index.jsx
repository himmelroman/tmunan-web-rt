/**
 *
 * Panel
 *
 */
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MdClose, MdFullscreen, MdFullscreenExit } from 'react-icons/md'

import { LCM_STATUS, LCM_STATUS_COLOR } from '~/lib/constants'
import lcmLive from '~/lib/lcmLive'
import logger from '~/lib/logger'
import { initialParameters, selectApp, setShowSource, setShowOutput, setCamera, setFPS, setPanel, setParameter } from '~/lib/redux'
import Toggle from '../Toggle'
import styles from './index.module.scss'

function debounce(func, timeout = 300) {
	let timer
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

const debouncedSend = debounce(lcmLive.send, 500)

export const updateParameter = (name, value) => (dispatch, getState) => {
	logger.log('update parameter:', name, value)
	dispatch(setParameter({ name, value }))
	const { app } = getState()
	if (app.lcmStatus !== LCM_STATUS.DISCONNECTED) {
		if (name === 'prompt') debouncedSend(app.parameters)
		else lcmLive.send(app.parameters)
	}
}

export const resetParameters = () => (dispatch, getState) => {
	logger.log('reset parameters')
	dispatch(setParameter({ ...initialParameters }))
	const { app } = getState()
	if (app.lcmStatus !== LCM_STATUS.DISCONNECTED) {
		lcmLive.send(app.parameters)
	}
}

const Panel = () => {
	const dispatch = useDispatch()

	const { parameters, fps, camera, lcmStatus, showSource, showOutput, noRearCamera } = useSelector(selectApp)

	const onChange = e => {
		e.stopPropagation()
		const { name, value } = e.target
		dispatch(updateParameter(name, value))
	}

	const onFPS = e => {
		dispatch(setFPS(e.target.value))
	}

	const onCamera = value => {
		logger.log('camera', value)
		dispatch(setCamera(value))
	}

	const onSource = value => {
		logger.log('showSource', value)
		dispatch(setShowSource(value))
	}

	const onOutput = value => {
		logger.log('showOutput', value)
		dispatch(setShowOutput(value))
	}

	const outsideClick = e => {
		if (e.target.closest(`.${styles.cont}`)) return
		dispatch(setPanel(false))
	}

	useEffect(() => {
		window.addEventListener('pointerdown', outsideClick)
		return () => {
			window.removeEventListener('pointerdown', outsideClick)
		}
	}, [])

	return (
		<div className={styles.cont}>
			{/* <div className={styles.panel}> */}
			<div className={styles.row} data-status style={{ color: LCM_STATUS_COLOR[lcmStatus] }}>
				<button
					className={styles.fullscreen}
					onClick={() => {
						document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
					}}
				>
					{document.fullscreenElement ? <MdFullscreenExit /> : <MdFullscreen />}
				</button>
				<span className={styles.status}>{lcmStatus}</span>
				<button className={styles.close} onClick={() => dispatch(setPanel(false))}>
					<MdClose />
				</button>
			</div>
			<div className={styles.row}>
				<div className={styles.col}>
					<label htmlFor='strength'>Strength: {parameters.strength}</label>
					<input name='strength' type='range' value={parameters.strength} min={0} max={3} step={0.01} onChange={onChange} />
				</div>
				<div className={styles.col}>
					<label htmlFor='guidance_scale'>Guidance: {parameters.guidance_scale}</label>
					<input name='guidance_scale' type='range' value={parameters.guidance_scale} min={0} max={1} step={0.01} onChange={onChange} />
				</div>
			</div>
			<div className={styles.row}>
				<div className={styles.col}>
					<label htmlFor='seed'>Seed: {parameters.seed}</label>
					<input name='seed' type='range' value={parameters.seed} step={1} min={0} max={30} onChange={onChange} />
				</div>
				<div className={styles.col}>
					<label htmlFor='fps'>FPS: {fps}</label>
					<input name='fps' type='range' value={fps} min={1} max={60} step={0.01} onChange={onFPS} />
				</div>
			</div>
			<div className={styles.row}>
				{noRearCamera ? (
					<div className={styles.col}>
						<label style={{ opacity: 0.5 }}>No Rear Camera</label>
					</div>
				) : (
					<div className={styles.col}>
						<label>{camera === 'environment' ? 'Back Camera' : 'Front Camera'}</label>
						<Toggle value={camera === 'environment'} onChange={onCamera} />
					</div>
				)}
				<div className={styles.col}>
					<label>Source Video</label>
					<Toggle value={showSource} onChange={onSource} />
				</div>
				<div className={styles.col}>
					<label>Output Video</label>
					<Toggle value={showOutput} onChange={onOutput} />
				</div>
			</div>
			<div className={styles.row} data-prompt>
				<div className={styles.col}>
					<label htmlFor='prompt'>Prompt</label>
					<textarea name='prompt' value={parameters.prompt} onChange={onChange} />
				</div>
			</div>
			<div className={styles.row}>
				<div className={styles.col}>
					<button
						name='reload'
						onClick={() => {
							window.location.reload()
						}}
					>
						reload
					</button>
				</div>
			</div>
		</div>
	)
}

export default memo(Panel)
