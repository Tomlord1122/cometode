import { app, shell, BrowserWindow, Tray, Menu, Notification, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase, getDatabase } from './db'
import { setupIPC } from './ipc'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let lastNotificationDate: string | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Hide window instead of closing on macOS (Command+W)
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  const resizedIcon = trayIcon.resize({ width: 18, height: 18 })
  resizedIcon.setTemplateImage(true)

  tray = new Tray(resizedIcon)
  tray.setToolTip('NeetCode Tracker')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show()
        if (process.platform === 'darwin') {
          app.dock.show()
        }
      }
    },
    {
      label: 'Hide from Dock',
      type: 'checkbox',
      checked: false,
      click: async (menuItem) => {
        if (process.platform === 'darwin') {
          if (menuItem.checked) {
            app.dock.hide()
          } else {
            app.dock.show()
          }
          // Save preference
          const db = getDatabase()
          db.prepare(`
            INSERT INTO preferences (key, value, updated_at)
            VALUES ('hideFromDock', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = excluded.updated_at
          `).run(menuItem.checked ? 'true' : 'false')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow?.show()
      if (process.platform === 'darwin') {
        app.dock.show()
      }
    }
  })
}

function checkAndShowNotification(): void {
  const today = new Date().toISOString().split('T')[0]

  // Only show once per day
  if (lastNotificationDate === today) {
    return
  }

  try {
    const db = getDatabase()
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM problem_progress
      WHERE DATE(next_review_date) <= DATE('now')
        AND status != 'new'
    `).get() as { count: number }

    if (result.count > 0) {
      const notification = new Notification({
        title: 'NeetCode Tracker',
        body: `You have ${result.count} problem${result.count > 1 ? 's' : ''} due for review today!`,
        icon: icon
      })

      notification.on('click', () => {
        mainWindow?.show()
        mainWindow?.focus()
        if (process.platform === 'darwin') {
          app.dock.show()
        }
      })

      notification.show()
      lastNotificationDate = today
    }
  } catch (error) {
    console.error('Failed to check for due reviews:', error)
  }
}

function loadDockPreference(): void {
  if (process.platform !== 'darwin') return

  try {
    const db = getDatabase()
    const result = db.prepare('SELECT value FROM preferences WHERE key = ?').get('hideFromDock') as { value: string } | undefined

    if (result?.value === 'true') {
      app.dock.hide()
      // Update tray menu
      if (tray) {
        const contextMenu = Menu.buildFromTemplate([
          {
            label: 'Show App',
            click: () => {
              mainWindow?.show()
              if (process.platform === 'darwin') {
                app.dock.show()
              }
            }
          },
          {
            label: 'Hide from Dock',
            type: 'checkbox',
            checked: true,
            click: async (menuItem) => {
              if (process.platform === 'darwin') {
                if (menuItem.checked) {
                  app.dock.hide()
                } else {
                  app.dock.show()
                }
                const db = getDatabase()
                db.prepare(`
                  INSERT INTO preferences (key, value, updated_at)
                  VALUES ('hideFromDock', ?, datetime('now'))
                  ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                `).run(menuItem.checked ? 'true' : 'false')
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Quit',
            click: () => {
              isQuitting = true
              app.quit()
            }
          }
        ])
        tray.setContextMenu(contextMenu)
      }
    }
  } catch (error) {
    console.error('Failed to load dock preference:', error)
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.neetcode-tracker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  const db = initDatabase()

  // Setup IPC handlers
  setupIPC(db)

  // Create window and tray
  createWindow()
  createTray()

  // Load dock preference
  loadDockPreference()

  // Check for due reviews and show notification
  setTimeout(() => {
    checkAndShowNotification()
  }, 3000) // Wait 3 seconds after app start

  // Check every hour for due reviews
  setInterval(() => {
    checkAndShowNotification()
  }, 60 * 60 * 1000)

  app.on('activate', function () {
    if (mainWindow) {
      mainWindow.show()
    } else {
      createWindow()
    }
  })
})

// macOS: Keep app running when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  closeDatabase()
})
