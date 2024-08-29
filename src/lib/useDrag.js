import { useEffect, useRef, useState } from 'react'

const useDrag = ({ selectedItems, itemSelector, handleSelector, ignoreSelector, delay, onChange }) => {
	const oref = useRef({})
	const itemRefs = useRef([])

	const [isDragging, setIsDragging] = useState(false)

	const startDrag = (e, item) => {
		const o = oref.current
		o.isDragging = true
		const parent = item.parentElement

		if (selectedItems?.length) {
			if (!selectedItems.includes(item.name)) return
			item = parent.querySelector(`[data-name="${selectedItems[0]}"]`)
		}

		o.oldIndex = parseInt(item.dataset.index)

		const { top, left } = item.getBoundingClientRect()
		o.startY = e.clientY - top + 1
		o.startX = e.clientX - left

		document.getSelection().empty()

		const siblings = Array.from(parent.querySelectorAll(itemSelector))

		const rects = siblings.map((el, index) => {
			const { top, left, bottom, right, width, height } = el.getBoundingClientRect()
			return { el, index, top, left, bottom, right, width, height, ignore: el.matches(ignoreSelector) }
		})

		o.minY = rects[0].top + o.startY
		o.maxY = rects[rects.length - 1].top + o.startY

		itemRefs.current = rects

		let dragElement

		dragElement = item.cloneNode(true)
		dragElement.className = `${dragElement.className} dragged`
		Object.assign(dragElement.style, {
			position: 'absolute',
			top: `${top}px`,
			left: `${left}px`,
			width: `${item.offsetWidth}px`,
			height: `${item.offsetHeight}px`,
			zIndex: 1000,
			pointerEvents: 'none',
			transition: 'none',
			boxShadow: '0 0 10px 0 #0002',
			userSelect: 'none',
			cursor: 'grabbing',
		})
		dragElement.dataset.index = o.oldIndex
		dragElement.innerHTML = item.innerHTML
		parent.appendChild(dragElement)
		o.dragElement = dragElement

		o.original = item
		o.original_order = item.style.order
		item.style.visibility = 'hidden'

		setIsDragging(true)
		onMouseMove(e)
	}

	const onMouseDown = e => {
		clearTimeout(oref.current.timeout)
		if (isDragging) return
		if (ignoreSelector && e.target.closest(ignoreSelector)) return
		if (handleSelector && !e.target.closest(handleSelector)) return
		const item = e.target.closest(itemSelector)
		if (!item) return

		document.addEventListener('pointerup', onMouseUp)
		document.addEventListener('pointermove', onMouseMove)

		if (delay) {
			oref.current.timeout = setTimeout(() => {
				startDrag(e, item)
			}, delay)
		} else {
			startDrag(e, item)
		}
	}

	const onMouseMove = e => {
		const o = oref.current
		clearTimeout(o.timeout)
		if (!o.isDragging) return

		const y = Math.min(o.maxY, Math.max(o.minY, e.clientY))

		const rects = itemRefs.current
		let i
		for (i = 0; i < rects.length; i++) {
			const { bottom, ignore } = rects[i]
			if (ignore) continue
			if (bottom > y) {
				break
			}
		}
		o.newIndex = i

		o.dragElement.style.top = `${y - o.startY}px`
		const after = i > o.oldIndex
		o.original.style.order = i * 2 + (after ? 2 : 0)
	}

	const onMouseUp = () => {
		document.removeEventListener('pointerup', onMouseUp)
		document.removeEventListener('pointermove', onMouseMove)
		clearTimeout(oref.current.timeout)
		if (!oref.current.isDragging) return
		const { oldIndex, newIndex, original, dragElement, original_order } = oref.current
		setIsDragging(false)
		dragElement.remove()
		original.style.visibility = ''
		oref.current = {}
		if (oldIndex !== newIndex) onChange?.({ oldIndex, newIndex })
		else original.style.order = original_order
	}

	useEffect(() => {
		document.addEventListener('pointerdown', onMouseDown)
		return () => {
			document.removeEventListener('pointerup', onMouseUp)
			document.removeEventListener('pointerdown', onMouseDown)
			document.removeEventListener('pointermove', onMouseMove)
		}
	}, [])

	return { isDragging }
}

export default useDrag
