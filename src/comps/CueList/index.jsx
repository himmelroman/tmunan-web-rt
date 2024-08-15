/**
 *
 * CueList
 *
 */
import { memo } from 'react'
import { useSelector } from 'react-redux'
import styles from './index.module.scss'
import { selectFrames } from '~/lib/redux'

const CueList = () => {
	const frames = useSelector(selectFrames)

	return (
		<div className={styles.cont}>
			<div className={styles.list}>
				{frames.map(f => (
					<div key={f.id} className={styles.item}>
						<div className={styles.name}>{f.name}</div>
					</div>
				))}
			</div>
			<div className={styles.footer}>
				<input type='text' placeholder='Frame name' />
				<button></button>
			</div>
		</div>
	)
}

export default memo(CueList)
