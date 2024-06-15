/**
 *
 * Panel
 *
 */
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setPanel, setParameter, setCamera, selectApp } from '~/lib/redux'
import styles from './index.module.scss'

const Panel = () => {
	const ref = useRef(null)

	const dispatch = useDispatch()

	const { parameters } = useSelector(selectApp)

	const onClickOutside = useCallback(e => {
		if (!e.target.closest('#panel')) {
			console.log('click outside')
			dispatch(setPanel(false))
		}
	}, [])

	useEffect(() => {
		window.addEventListener('click', onClickOutside)

		return () => {
			window.removeEventListener('click', onClickOutside)
		}
	}, [])

	const onChange = e => {
		console.log('input', e.target.value)
		dispatch(setParameter([e.target.name, e.target.value]))
	}

	const onCamera = e => {
		console.log('camera', e.target.checked)
		dispatch(setCamera(e.target.checked))
	}

	return (
		<div id='panel' className={styles.cont} ref={ref}>
			{/* Your component content goes here */}
			<div className={styles.row}>
				<div className={styles.col}>
					<label htmlFor='strength'>Strength: {parameters.strength}</label>
					<input name='strength' type='range' value={parameters.strength} min={0} max={1} step={0.01} onChange={onChange} />
				</div>
				<div className={styles.col}>
					<label htmlFor='guidance_scale'>Guidance Scale: {parameters.guidance_scale}</label>
					<input name='guidance_scale' type='range' value={parameters.guidance_scale} min={0} max={1} step={0.01} onChange={onChange} />
				</div>
				<div className={styles.col}>
					<label htmlFor='seed'>Seed: {parameters.seed}</label>
					<input name='seed' type='range' value={parameters.seed} step={1} min={0} max={30} onChange={onChange} />
				</div>
			</div>
			<div className={styles.row}>
				{/* <div className={styles.col}>
					<label htmlFor='interval'>{`Interval:${parameters.interval}`}</label>
					<input name='interval' type='range' value={parameters.interval} min={200} max={1200} step={50} onChange={onChange} />
				</div> */}
				<div className={styles.col}>
					<label htmlFor='camera'>Camera</label>
					<input name='camera' type='checkbox' checked={parameters.camera} onChange={onCamera} />
				</div>
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
			<div className={styles.col}>
				<label htmlFor='prompt'>Prompt</label>
				<input name='prompt' value={parameters.prompt} onChange={onChange} />
			</div>
		</div>
	)
}

export default Panel
