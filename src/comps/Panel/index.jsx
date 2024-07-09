/**
 *
 * Panel
 *
 */
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MdClose } from 'react-icons/md'

import { LCM_STATUS, LCM_STATUS_COLOR } from '~/lib/constants'
import lcmLive from '~/lib/lcmLive'
import logger from '~/lib/logger'
import { initialParameters, selectApp, setOriginal, setCamera, setFPS, setPanel, setParameter } from '~/lib/redux'
import Toggle from '../Toggle'
import styles from './index.module.scss'

export const updateParameter = (name, value) => (dispatch, getState) => {
	logger.log('update parameter:', name, value)
	dispatch(setParameter({ name, value }))
	const { app } = getState()
	if (app.lcmStatus !== LCM_STATUS.DISCONNECTED) {
		lcmLive.send(app.parameters)
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

// parse %c style color string and return color and string without markup
const parseColor = str => {
	const colorMatch = str.match(/%c(.*?)color:([^;]+)/)
	if (colorMatch) {
		return { message: colorMatch[1], color: colorMatch[2] }
	}
	return { color: '', message: str }
}

const Panel = () => {
	const dispatch = useDispatch()

	const { parameters, fps, camera, lcmStatus, showOriginal } = useSelector(selectApp)

	// const log_lines = useSelector(selectLog)

	const onChange = e => {
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

	const onOriginl = value => {
		logger.log('showOriginal', value)
		dispatch(setOriginal(value))
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
				<span>{lcmStatus}</span>
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
					<label htmlFor='guidance_scale'>Guidance Scale: {parameters.guidance_scale}</label>
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
				<div className={styles.col}>
					<label>Camera: {camera}</label>
					<Toggle value={camera === 'user'} onChange={onCamera} />
				</div>
				<div className={styles.col}>
					<label>Show Original Video:</label>
					<Toggle value={showOriginal} onChange={onOriginl} />
				</div>
			</div>
			<div className={styles.row}>
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
			{/* </div> */}
			{/* <div className={styles.console}>
				{log_lines.map((line, i) => {
					const { color, message } = parseColor(line.message)
					return (
						<div key={i} className={styles['line-' + line.type]} style={{ color }}>
							<span>{message}</span>
						</div>
					)
				})}
			</div> */}
		</div>
	)
}

export default memo(Panel)
