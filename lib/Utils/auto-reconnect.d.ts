export interface SocketConnectionUpdate {
    connection?: 'connecting' | 'open' | 'close' | string;
    lastDisconnect?: {
        error?: {
            output?: { statusCode?: number };
            statusCode?: number;
        } | null;
    } | null;
    qr?: string;
    [key: string]: unknown;
}

export interface SupervisedSocket {
    ev: {
        on(event: 'connection.update', listener: (update: SocketConnectionUpdate) => void): unknown;
        off?(event: 'connection.update', listener: (update: SocketConnectionUpdate) => void): unknown;
    };
    end?(error?: Error): unknown;
}

export interface SocketSupervisorOptions<T extends SupervisedSocket> {
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    jitter?: number;
    maxRetries?: number;
    onSocket?: (socket: T) => void;
    onUpdate?: (update: SocketConnectionUpdate, socket: T) => void;
    onReconnect?: (details: {
        attempt: number;
        delayMs: number;
        statusCode?: number;
        update?: SocketConnectionUpdate;
        error?: Error;
    }) => void;
    onAuthRequired?: (details: {
        statusCode: number;
        update: SocketConnectionUpdate;
        socket: T;
    }) => void;
    onGiveUp?: (details: {
        reason?: 'connection-replaced' | 'forbidden';
        statusCode?: number;
        update?: SocketConnectionUpdate;
        error?: Error;
        attempts: number;
    }) => void;
    onError?: (error: Error) => void;
}

export interface SocketSupervisor<T extends SupervisedSocket> {
    start(): Promise<T | null>;
    stop(options?: { closeSocket?: boolean }): void;
    getSocket(): T | null;
    readonly isRunning: boolean;
    readonly retryCount: number;
}

export declare function createSocketSupervisor<T extends SupervisedSocket>(
    createSocket: () => T | Promise<T>,
    options?: SocketSupervisorOptions<T>
): SocketSupervisor<T>;
