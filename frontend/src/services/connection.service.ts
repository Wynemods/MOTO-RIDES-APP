import NetInfo from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

export interface ConnectionStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifiEnabled: boolean;
  isCellularEnabled: boolean;
}

class ConnectionService extends EventEmitter {
  private isConnected: boolean = true;
  private isInternetReachable: boolean | null = true;
  private connectionType: string | null = null;
  private isWifiEnabled: boolean = false;
  private isCellularEnabled: boolean = false;
  private unsubscribe: (() => void) | null = null;
  private lastConnectionState: boolean = true;

  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      const wasInternetReachable = this.isInternetReachable;

      this.isConnected = state.isConnected ?? false;
      this.isInternetReachable = state.isInternetReachable;
      this.connectionType = state.type;
      this.isWifiEnabled = state.isWifiEnabled ?? false;
      // Note: isCellularEnabled is not available in all NetInfo states
      this.isCellularEnabled = (state as any).isCellularEnabled ?? false;

      // Emit connection status change
      this.emit('connectionChange', this.getConnectionStatus());

      // Emit specific events for connection state changes
      if (wasConnected !== this.isConnected) {
        if (this.isConnected) {
          this.emit('connected');
        } else {
          this.emit('disconnected');
        }
      }

      // Emit internet reachability changes
      if (wasInternetReachable !== this.isInternetReachable) {
        if (this.isInternetReachable === true) {
          this.emit('internetReachable');
        } else if (this.isInternetReachable === false) {
          this.emit('internetUnreachable');
        }
      }

      // Emit combined internet status (connection + reachability)
      const hasInternet = this.isConnected && this.isInternetReachable === true;
      if (this.lastConnectionState !== hasInternet) {
        this.lastConnectionState = hasInternet;
        if (hasInternet) {
          this.emit('online');
        } else {
          this.emit('offline');
        }
      }
    });
  }

  public getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected,
      isInternetReachable: this.isInternetReachable,
      type: this.connectionType,
      isWifiEnabled: this.isWifiEnabled,
      isCellularEnabled: this.isCellularEnabled,
    };
  }

  public isOnline(): boolean {
    return this.isConnected && this.isInternetReachable === true;
  }

  public isOffline(): boolean {
    return !this.isConnected || this.isInternetReachable === false;
  }

  public getConnectionType(): string | null {
    return this.connectionType;
  }

  public isWifi(): boolean {
    return this.connectionType === 'wifi' && this.isWifiEnabled;
  }

  public isCellular(): boolean {
    return this.connectionType === 'cellular' && this.isCellularEnabled;
  }

  public destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.removeAllListeners();
  }

  // Event listener methods
  public onConnectionChange(callback: (status: ConnectionStatus) => void) {
    this.on('connectionChange', callback);
  }

  public onOnline(callback: () => void) {
    this.on('online', callback);
  }

  public onOffline(callback: () => void) {
    this.on('offline', callback);
  }

  public onConnected(callback: () => void) {
    this.on('connected', callback);
  }

  public onDisconnected(callback: () => void) {
    this.on('disconnected', callback);
  }

  public onInternetReachable(callback: () => void) {
    this.on('internetReachable', callback);
  }

  public onInternetUnreachable(callback: () => void) {
    this.on('internetUnreachable', callback);
  }

  // Remove listeners
  public offConnectionChange(callback: (status: ConnectionStatus) => void) {
    this.off('connectionChange', callback);
  }

  public offOnline(callback: () => void) {
    this.off('online', callback);
  }

  public offOffline(callback: () => void) {
    this.off('offline', callback);
  }

  public offConnected(callback: () => void) {
    this.off('connected', callback);
  }

  public offDisconnected(callback: () => void) {
    this.off('disconnected', callback);
  }

  public offInternetReachable(callback: () => void) {
    this.off('internetReachable', callback);
  }

  public offInternetUnreachable(callback: () => void) {
    this.off('internetUnreachable', callback);
  }
}

// Export singleton instance
export default new ConnectionService();
