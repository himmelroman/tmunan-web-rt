/**
 *
 * AnimatedRange
 *
 */
import Range from '../Range'
import styles from './index.module.scss'

const AnimatedRange = props => {
	return (
		<div className={styles.cont}>
			<Range {...props} />
		</div>
	)
}

export default AnimatedRange
