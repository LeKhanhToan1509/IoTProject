import type { SensorData } from '../types';

interface SensorMessage {
  temperature: number;
  humidity: number;
  light_raw: number;
}

type WebSocketListener = (data: SensorData) => void;

class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private listeners: Set<WebSocketListener> = new Set();
  private reconnectTimeout: number | null = null;
  private url: string = 'ws://localhost:8080/ws';
  private connected: boolean = false;
  private isConnecting: boolean = false;
  private connectionId: string = '';

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocketManager: Already connecting');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocketManager: Already connected');
      return;
    }

    this.connectionId = `mgr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.isConnecting = true;

    console.log(`WebSocketManager [${this.connectionId}]: Connecting to ${this.url}`);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error(`WebSocketManager [${this.connectionId}]: Failed to create connection:`, error);
      this.isConnecting = false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.connected = true;
      console.log(`WebSocketManager [${this.connectionId}]: Connected successfully`);
      
      // Clear any pending reconnect
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        console.log(`WebSocketManager [${this.connectionId}]: Message received:`, event.data);
        const data: SensorMessage = JSON.parse(event.data);
        
        const sensorData: SensorData = {
          ID: Date.now(),
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          temperature: data.temperature,
          humidity: data.humidity,
          light: data.light_raw,
        };

        // Notify all listeners
        this.listeners.forEach(listener => {
          try {
            listener(sensorData);
          } catch (error) {
            console.error('WebSocketManager: Error in listener:', error);
          }
        });
      } catch (error) {
        console.error(`WebSocketManager [${this.connectionId}]: Failed to parse message:`, error);
      }
    };

    this.ws.onerror = (event) => {
      this.isConnecting = false;
      console.error(`WebSocketManager [${this.connectionId}]: Error occurred:`, event);
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.connected = false;
      console.log(`WebSocketManager [${this.connectionId}]: Connection closed`);
      
      // Auto reconnect after 3 seconds
      this.reconnectTimeout = setTimeout(() => {
        console.log(`WebSocketManager [${this.connectionId}]: Reconnecting...`);
        this.connect();
      }, 3000);
    };
  }

  addListener(listener: WebSocketListener): () => void {
    this.listeners.add(listener);
    console.log(`WebSocketManager: Added listener, total: ${this.listeners.size}`);
    
    // Start connection if not already connected
    if (!this.connected && !this.isConnecting) {
      this.connect();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      console.log(`WebSocketManager: Removed listener, total: ${this.listeners.size}`);
      
      // Close connection if no more listeners
      if (this.listeners.size === 0 && this.ws) {
        console.log('WebSocketManager: No more listeners, closing connection');
        this.ws.close();
        this.ws = null;
        this.connected = false;
        
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      }
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connected = false;
    this.isConnecting = false;
    this.listeners.clear();
    console.log('WebSocketManager: Disconnected and cleared all listeners');
  }
}

export default WebSocketManager;