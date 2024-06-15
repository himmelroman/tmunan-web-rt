import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const CFImage = ({ src, id, className }) => {
	const [currentSrc, setCurrentSrc] = useState(src)
	const [nextSrc, setNextSrc] = useState(null)

	useEffect(() => {
		setNextSrc(src)
	}, [src])

	const handleImageLoad = e => {
		setCurrentSrc(nextSrc)
		setNextSrc(null)
	}

	return (
		<div id={id} className={className}>
			<img src={currentSrc} />
			<img src={nextSrc} onLoad={handleImageLoad} />
		</div>
	)
}

CFImage.propTypes = {
	id: PropTypes.string,
	src: PropTypes.string,
	className: PropTypes.string,
}

export default CFImage
