/**
 *
 * AppBar
 *
 */
import { useDispatch, useSelector } from 'react-redux'

import { Menu, MenuItem } from '~/comps/Menu'
import { defaultState, reset, selectApp } from '~/lib/redux'
import socket from '~/lib/socket'
import styles from './index.module.scss'
import { keyBindings, keyActions } from '~/lib/key-bindings'
import Button from '../Button'
import { useAuth0 } from '@auth0/auth0-react'

const AppBar = () => {
	const { logout } = useAuth0()
	const { show_source, show_output, show_cuelist, rtc_state } = useSelector(selectApp)

	const handleLogout = () => {
		logout({
			logoutParams: {
				returnTo: 'https://tmunan.icu',
			},
		})
	}

	const handleReset = () => {
		socket.send('parameters', { ...defaultState.parameters, override: true })
		dispatch(reset())
	}

	const dispatch = useDispatch()

	return (
		<div className={styles.cont} id='app_bar'>
			<Menu menuButton={<Button icon='menu' />}>
				<MenuItem name='new_project' onClick={keyActions.new_project} hotkey={keyBindings.new_project}>
					New
				</MenuItem>
				<MenuItem name='open_project' onClick={keyActions.open_project} hotkey={keyBindings.open_project}>
					Open
				</MenuItem>
				<MenuItem name='save' onClick={keyActions.save_project} hotkey={keyBindings.save_project}>
					Save
				</MenuItem>
				<MenuItem name='save_as' onClick={keyActions.save_project_as} hotkey={keyBindings.save_project_as}>
					Save As
				</MenuItem>
				<MenuItem name='import' onClick={keyActions.import_project} hotkey={keyBindings.import_project}>
					Import
				</MenuItem>
				<MenuItem name='export' onClick={keyActions.export_project} hotkey={keyBindings.export_project}>
					Export
				</MenuItem>
			</Menu>
			<Menu menuButton={<Button icon='visibility' />}>
				<MenuItem
					name='show_souce'
					type='checkbox'
					checked={show_source}
					onClick={keyActions.show_source}
					hotkey={keyBindings.show_source}
				>
					Show Source Video
				</MenuItem>
				<MenuItem
					name='show_output'
					type='checkbox'
					checked={show_output}
					onClick={keyActions.show_output}
					hotkey={keyBindings.show_output}
				>
					Show Output Video
				</MenuItem>
				<MenuItem
					name='show_cuelist'
					type='checkbox'
					onClick={keyActions.show_cuelist}
					checked={show_cuelist}
					hotkey={keyBindings.show_cuelist}
				>
					Show Cuelist
				</MenuItem>
				<MenuItem
					name='fullscreen'
					checked={document.fullscreenElement}
					onClick={keyActions.fullscreen}
					hotkey={keyBindings.fullscreen}
					type='checkbox'
				>
					Full Screen
				</MenuItem>
			</Menu>
			<span className={styles.sep} />
			<button name='reset' onClick={handleReset}>
				<span className='material-symbols-outlined'>reset_image</span>
			</button>

			<span data-spacer />
			<Button
				name='toggle_power'
				icon='power_settings_new'
				onClick={keyActions.toggle_power}
				data-state={rtc_state}
			/>
			<Menu
				name='account_menu'
				menuButton={<Button icon='account_circle' className={styles.account_button} />}
				gap={7}
				// boundingBoxPadding='5'
			>
				<MenuItem name='dashboard' href='https://tmunan.icu/dashboard' target='_blank'>
					Dashboard
				</MenuItem>
				<MenuItem name='logout' onClick={handleLogout}>
					Logout
				</MenuItem>
			</Menu>
		</div>
	)
}

export default AppBar
