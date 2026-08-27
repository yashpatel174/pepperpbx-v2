import { io, Socket } from 'socket.io-client'
import useAuthStore from '../../store/auth'

const WS_URL = import.meta.env.VITE_WS_URL as string | undefined

type EventHandler = (...args: unknown[]) => void

/**
 * One shared Socket.IO connection for the whole app. Modules subscribe/unsubscribe through
 * this manager instead of each opening their own `socket.io-client` connection — see
 * CLAUDE.md's WebSocket rule. No PBX events are wired up yet; this is the connection
 * lifecycle only, ready for live modules (Active Calls, Queues, etc.) to build on.
 */
class SocketManager {
  private socket: Socket | null = null

  connect(): Socket | null {
    if (!WS_URL) {
      console.warn('SocketManager.connect() called without VITE_WS_URL configured — skipping.')
      return null
    }
    if (this.socket?.connected) {
      return this.socket
    }

    const { accessToken } = useAuthStore.getState()
    this.socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      auth: accessToken ? { token: accessToken } : undefined,
    })

    return this.socket
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  subscribe(event: string, handler: EventHandler): void {
    this.socket?.on(event, handler)
  }

  unsubscribe(event: string, handler: EventHandler): void {
    this.socket?.off(event, handler)
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export const socketManager = new SocketManager()
export default socketManager
