import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

type NetworkListener = (isOnline: boolean) => void;

let currentState: NetInfoState | null = null;
let unsubscribe: (() => void) | null = null;
const listeners = new Set<NetworkListener>();

function isOnlineState(state: NetInfoState): boolean {
  return !!state.isConnected && state.isInternetReachable !== false;
}

function publish(): void {
  if (!currentState) return;
  const online = isOnlineState(currentState);
  listeners.forEach(listener => listener(online));
}

/**
 * Estado de red global.
 *
 * El colaborador en campo necesita distinguir "no tengo documentos" de "no me
 * llega la red": sin esta señal, un fallo de conexión se presenta como si el
 * listado estuviera vacio. El modulo mantiene una sola suscripcion a NetInfo
 * y reparte el estado entre todos los que lo observan.
 */
export function useNetwork(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    () => (currentState ? isOnlineState(currentState) : true)
  );

  useEffect(() => {
    const listener: NetworkListener = online => setIsOnline(online);
    listeners.add(listener);

    if (!unsubscribe) {
      unsubscribe = NetInfo.addEventListener(state => {
        currentState = state;
        publish();
      });
    }
    // El estado puede haber cambiado antes de que esta pantalla se montara.
    publish();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return isOnline;
}
