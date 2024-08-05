/**
 *
 * Panel
 *
 */
import { memo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MdClose, MdFullscreen, MdFullscreenExit, MdReorder } from 'react-icons/md'

// import { LCM_STATUS, LCM_STATUS_COLOR } from '~/lib/constants'
import socket from '~/lib/socket'
import logger from '~/lib/logger'
import { initialParameters, selectApp, setShowSource, setShowOutput, setCamera, setFPS, setPanel } from '~/lib/redux'
import Toggle from '../Toggle'
import styles from './index.module.scss'
import Select from '../Select'
import useClasses from '~/lib/useClasses'
import { NAME } from '~/lib/constants'

function debounce(func, timeout = 300) {
	let timer
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

const debouncedSend = debounce(socket.json, 500)

export const resetParameters = () => (dispatch, getState) => {
	logger.log('reset parameters')
	const { app } = getState()
	if (app.connected) {
		socket.json('set_parameters', initialParameters)
	}
}

const Panel = () => {
	const dispatch = useDispatch()

	const { fps, camera, cameras, connected, active, showSource, showOutput, server } = useSelector(selectApp)

	const { parameters, connections } = server

	const [prompt, setPrompt] = useState('')

	const [showClients, setShowClients] = useState(true)

	const onChange = e => {
		e.stopPropagation()
		const { name, value } = e.target
		socket.json('set_parameters', { [name]: value, override: true })
	}

	const onPrompt = e => {
		e.stopPropagation()
		const { value } = e.target
		setPrompt(value)
		localStorage.setItem('prompt', value)
		// dispatch(updateParameter(name, value))
		if (connected) debouncedSend('set_parameters', { prompt: value, override: true })
	}

	useEffect(() => {
		setPrompt(parameters.prompt)
	}, [parameters.prompt])

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

	const onConnectionClick = e => {
		const { name } = e.target.closest(`.${styles.connection}`).dataset
		console.log('set active name', name)
		// const connection = connections.find(c => c.info.name === name)
		socket.json('set_active_name', { name })
	}

	const cls = useClasses(styles.cont, connected && styles.connected, active && styles.active)

	return (
		<div className={cls}>
			<div className={styles.row} data-status>
				<button
					className={styles.fullscreen}
					onClick={() => {
						document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
					}}
				>
					{document.fullscreenElement ? <MdFullscreenExit /> : <MdFullscreen />}
				</button>
				<div className={styles.leds}>
					<div className={styles.led} data-connected />
					<div className={styles.led} data-active />
				</div>
				<button className={styles.close} onClick={() => setShowClients(showClients ? false : true)}>
					<MdReorder />
				</button>
				<button className={styles.close} onClick={() => dispatch(setPanel(false))}>
					<MdClose />
				</button>
			</div>
			<main>
				<section>
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
						<div className={styles.col}>
							<label>Source Video</label>
							<Toggle value={showSource} onChange={onSource} />
						</div>
						<div className={styles.col}>
							<label>Output Video</label>
							<Toggle value={showOutput} onChange={onOutput} />
						</div>
					</div>
					<div className={styles.row}>
						<div className={styles.col}>
							<label>Camera</label>
							<Select className={styles.select} name='camera' options={[...cameras, 'test']} value={camera} onChange={onCamera} />
						</div>
					</div>
					<div className={styles.row} data-prompt>
						<div className={styles.col}>
							<label htmlFor='prompt'>Prompt</label>
							<textarea name='prompt' value={prompt} onChange={onPrompt} />
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
				</section>
				{showClients && (
					<section>
						<div className={styles.connections}>
							{connections.map((c, i) => (
								<div key={i} className={styles.connection} data-name={c.info.name} data-active={c.active || null} data-self={NAME === c.info.name || null} onClick={onConnectionClick}>
									<div className={styles.name}>{c.info.name || c.info.host}</div>
									<div className={styles.active}>{c.active ? 'active' : ''}</div>
								</div>
							))}
						</div>
					</section>
				)}
			</main>
		</div>
	)
}

export default memo(Panel)
