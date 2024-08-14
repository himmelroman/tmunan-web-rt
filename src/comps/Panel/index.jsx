/**
 *
 * Panel
 *
 */
import { memo, useEffect, useState } from 'react'
import { MdClose, MdFullscreen, MdFullscreenExit, MdRefresh, MdReorder } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

// import { NAME } from '~/lib/constants'
import { FILTER_LIST, NAME } from '~/lib/constants'
import logger from '~/lib/logger'
import { applyFilter, selectApp, setCamera, setFlipped, setFPS, setShowClients, setShowOutput, setShowPanel, setShowSource } from '~/lib/redux'
import socket from '~/lib/socket'
import useClasses from '~/lib/useClasses'
import Range from '../Range'
import Select from '../Select'
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

const debouncedSend = debounce(socket.send, 500)

const Panel = () => {
	const dispatch = useDispatch()

	const { fps, camera, flipped, filter, cameras, connected, active, show_clients, show_source, show_output, presence } = useSelector(selectApp)

	const { parameters, connections, active_connection_name } = presence

	const [prompt, setPrompt] = useState('')
	const [negativePrompt, setNegativePrompt] = useState('')

	const onChange = e => {
		e.stopPropagation()
		const { name, value } = e.target
		socket.send('set_parameters', { [name]: Number(value), override: true })
	}

	const onText = e => {
		e.stopPropagation()
		const { name, value } = e.target
		if (name === 'prompt') setPrompt(value)
		else setNegativePrompt(value)
		localStorage.setItem(name, value)
		if (connected) debouncedSend('set_parameters', { [name]: value, override: true })
	}

	useEffect(() => {
		setPrompt(parameters.prompt)
		setNegativePrompt(parameters.negative)
	}, [parameters])

	const onFPS = e => {
		dispatch(setFPS(e.target.value))
	}

	const onCamera = (name, value) => {
		dispatch(setCamera(value))
	}

	const onSource = (name, value) => {
		dispatch(setShowSource(value))
	}

	const onOutput = (name, value) => {
		dispatch(setShowOutput(value))
	}

	const onFlip = (name, value) => {
		dispatch(setFlipped(value))
	}

	const onFilterChange = (value, name) => {
		dispatch(applyFilter({ [name]: value }))
	}

	const outsideClick = e => {
		if (e.target.closest(`.${styles.cont}`)) return
		dispatch(setShowPanel(false))
	}

	useEffect(() => {
		window.addEventListener('pointerdown', outsideClick)
		return () => {
			window.removeEventListener('pointerdown', outsideClick)
		}
	}, [])

	const onConnectionClick = e => {
		const { name } = e.target.closest(`.${styles.connection}`).dataset
		logger.info('set active name', name)
		socket.send('set_active_name', { name })
	}

	const cls = useClasses(styles.cont, connected && styles.connected, active && styles.active)

	const ranges = FILTER_LIST.map(f => (
		<Range key={f.name} name={f.name} label={f.label} value={f.name in filter ? filter[f.name] : f.default} onChange={onFilterChange} min={f.min} max={f.max} step={f.step} />
	))

	return (
		<div className={cls}>
			<div className={styles.header}>
				<div className={styles.led} data-connected />
				<button
					className={styles.fullscreen}
					onClick={() => {
						document.fullscreenElement ? document.exitFullscreen() : document.querySelector('body').requestFullscreen()
					}}
				>
					{document.fullscreenElement ? <MdFullscreenExit /> : <MdFullscreen />}
				</button>
				<button
					onClick={() => {
						window.location.reload()
					}}
				>
					<MdRefresh />
				</button>
				<button onClick={() => dispatch(setShowClients(show_clients ? false : true))}>
					<MdReorder />
				</button>
				<div className={styles.right}>
					<button onClick={() => dispatch(setShowPanel(false))}>
						<MdClose />
					</button>
				</div>
			</div>
			<main>
				<section>
					<div className={styles.row} data-1>
						<div className={styles.col}>
							<Select className={styles.select} name='camera' itemToString={a => window.cmap[a]} itemToValue={a => a} options={cameras} value={camera} onChange={onCamera} />
						</div>
					</div>
					<div className={styles.row} data-4>
						<div className={styles.col}>
							<label>Source</label>
							<Toggle name='source' value={show_source} onChange={onSource} />
						</div>
						<div className={styles.col}>
							<label>Output</label>
							<Toggle name='output' value={show_output} onChange={onOutput} />
						</div>
						<div className={styles.col}>
							<label>Flip</label>
							<Toggle name='flip' value={flipped} onChange={onFlip} />
						</div>
						{/* <div className={styles.col}>
							<label>Invert</label>
							<Toggle name='invert' value={inverted} onChange={onInvert} />
						</div> */}
					</div>
					<div className={styles.row}>
						<div className={styles.col}>
							<label htmlFor='strength'>Strength: {parameters.strength}</label>
							<input name='strength' type='range' value={parameters.strength} min={1} max={3} step={0.01} onChange={onChange} />
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
							<input name='fps' type='range' value={fps} min={1} max={30} step={0.01} onChange={onFPS} />
						</div>
					</div>
					<div className={`${styles.row} ${styles.prompt}`} data-1>
						<div className={styles.col}>
							<textarea name='prompt' value={prompt} placeholder='Prompt' onChange={onText} />
							<textarea name='negative_prompt' value={negativePrompt} placeholder='Negative prompt' onChange={onText} />
						</div>
					</div>
					<div className={styles.row}>
						{ranges}
						{/* <Range name='brightness' className={styles.col} min={-1} max={1} value={filter['brightness']} />
						<Range name='contrast' className={styles.col} min={-1} max={1} value={filter['contrast']} />
						<Range name='hue' className={styles.col} min={-1} max={1} value={filter['hue-rotate']} />
						<Range name='saturate' className={styles.col} min={-1} max={1} value={filter['saturate']} /> */}
					</div>
				</section>
				{show_clients && (
					<section>
						{/* <div className={styles.heading}>Connections</div> */}
						<div className={styles.connections}>
							{connections.map((c, i) => (
								<div
									key={i}
									className={styles.connection}
									data-name={c.name}
									data-self={NAME === c.name || null}
									data-active={c.name === active_connection_name || null}
									onClick={onConnectionClick}
								>
									{c.name}
									{NAME === c.name && ' (You)'}
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
