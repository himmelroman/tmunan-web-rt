/**
 *
 * Loader
 *
 */
import styles from './index.module.scss'

const Loader = () => {
	return (
		<div className={styles.cont}>
			<span className={`material-symbols-outlined ${styles.spinner}`}>progress_activity</span>
		</div>
	)
}

export default Loader
