import { useState } from 'react'
import { useClick } from './useClick'

const useHover = (isOpen, onToggle, { openDelay = 50, closeDelay = 0 } = {}) => {
	const [config] = useState({})

	const clearTimer = () => clearTimeout(config.t)
	const delayAction = toOpen => e => {
		clearTimer()
		config.t = setTimeout(() => onToggle(toOpen, e), toOpen ? openDelay : closeDelay)
	}
	const props = {
		onMouseEnter: delayAction(true),
		onMouseLeave: delayAction(false),
	}

	return {
		anchorProps: { ...props, ...useClick(isOpen, onToggle) },
		hoverProps: { ...props, onMouseEnter: clearTimer },
	}
}

export { useHover }
