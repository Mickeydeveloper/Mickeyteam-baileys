import { DisconnectReason } from '../Types/index.js';

const AUTH_REQUIRED_CODES = new Set([
    DisconnectReason.loggedOut,
    DisconnectReason.badSession,
    DisconnectReason.multideviceMismatch
]);

const STOP_CODES = new Map([
    [DisconnectReason.connectionReplaced, 'connection-replaced'],
    [DisconnectReason.forbidden, 'forbidden']
]);

const readStatusCode = error => error?.output?.statusCode ?? error?.statusCode;

export const createSocketSupervisor = (createSocket, options = {}) => {
    if (typeof createSocket !== 'function') {
        throw new TypeError('createSocket must be a function');
    }

    const initialDelayMs = options.initialDelayMs ?? 1000;
    const maxDelayMs = options.maxDelayMs ?? 30000;
    const backoffFactor = options.backoffFactor ?? 2;
    const jitter = options.jitter ?? 0.2;
    const maxRetries = options.maxRetries ?? Infinity;

    if (!Number.isFinite(initialDelayMs) || initialDelayMs < 0) {
        throw new RangeError('initialDelayMs must be a non-negative number');
    }
    if (!Number.isFinite(maxDelayMs) || maxDelayMs < initialDelayMs) {
        throw new RangeError('maxDelayMs must be greater than or equal to initialDelayMs');
    }
    if (!Number.isFinite(backoffFactor) || backoffFactor < 1) {
        throw new RangeError('backoffFactor must be a number greater than or equal to 1');
    }
    if (!Number.isFinite(jitter) || jitter < 0 || jitter > 1) {
        throw new RangeError('jitter must be between 0 and 1');
    }
    if (!(maxRetries === Infinity || Number.isInteger(maxRetries) && maxRetries >= 0)) {
        throw new RangeError('maxRetries must be a non-negative integer or Infinity');
    }

    let socket = null;
    let updateListener = null;
    let retryTimer = null;
    let retries = 0;
    let generation = 0;
    let running = false;
    let opening = null;

    const notify = (name, ...args) => {
        try {
            options[name]?.(...args);
        }
        catch (error) {
            if (name !== 'onError') {
                try { options.onError?.(error); } catch {}
            }
        }
    };

    const detach = current => {
        if (current?.ev?.off && updateListener) {
            current.ev.off('connection.update', updateListener);
        }
        updateListener = null;
    };

    const stop = ({ closeSocket = true } = {}) => {
        running = false;
        generation++;
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        opening = null;
        const current = socket;
        socket = null;
        detach(current);
        if (closeSocket) {
            try {
                Promise.resolve(current?.end?.(new Error('Socket supervisor stopped')))
                    .catch(error => notify('onError', error));
            }
            catch (error) {
                notify('onError', error);
            }
        }
    };

    let openSocket;
    const scheduleReconnect = details => {
        if (!running || retryTimer) return;
        if (retries >= maxRetries) {
            running = false;
            notify('onGiveUp', { ...details, attempts: retries });
            return;
        }

        retries++;
        const baseDelay = Math.min(maxDelayMs, initialDelayMs * backoffFactor ** (retries - 1));
        const delay = Math.min(maxDelayMs, Math.round(baseDelay * (1 - jitter + Math.random() * jitter * 2)));
        notify('onReconnect', { ...details, attempt: retries, delayMs: delay });
        retryTimer = setTimeout(() => {
            retryTimer = null;
            void openSocket();
        }, delay);
    };

    openSocket = () => {
        if (!running) return Promise.resolve(null);
        if (socket) return Promise.resolve(socket);
        if (opening) return opening;

        const currentGeneration = ++generation;
        const pending = Promise.resolve()
            .then(createSocket)
            .then(nextSocket => {
                if (!running || currentGeneration !== generation) {
                    try {
                        Promise.resolve(nextSocket?.end?.(new Error('Socket supervisor stopped')))
                            .catch(error => notify('onError', error));
                    }
                    catch (error) {
                        notify('onError', error);
                    }
                    return null;
                }
                if (!nextSocket?.ev?.on) {
                    throw new TypeError('createSocket must return a socket with an ev.on event emitter');
                }

                const nextUpdateListener = update => {
                    if (!running || socket !== nextSocket || currentGeneration !== generation) return;
                    notify('onUpdate', update, nextSocket);

                    if (update?.connection === 'open') {
                        retries = 0;
                        return;
                    }
                    if (update?.connection !== 'close') return;

                    const statusCode = readStatusCode(update.lastDisconnect?.error);
                    socket = null;
                    detach(nextSocket);

                    if (AUTH_REQUIRED_CODES.has(statusCode)) {
                        running = false;
                        generation++;
                        notify('onAuthRequired', { statusCode, update, socket: nextSocket });
                        return;
                    }
                    if (STOP_CODES.has(statusCode)) {
                        running = false;
                        generation++;
                        notify('onGiveUp', { reason: STOP_CODES.get(statusCode), statusCode, update, attempts: retries });
                        return;
                    }

                    scheduleReconnect({ statusCode, update });
                };
                socket = nextSocket;
                updateListener = nextUpdateListener;
                nextSocket.ev.on('connection.update', nextUpdateListener);
                notify('onSocket', nextSocket);
                return nextSocket;
            })
            .catch(error => {
                const failedSocket = socket;
                if (failedSocket) {
                    socket = null;
                    detach(failedSocket);
                    try {
                        Promise.resolve(failedSocket.end?.(error)).catch(closeError => notify('onError', closeError));
                    }
                    catch (closeError) {
                        notify('onError', closeError);
                    }
                }
                notify('onError', error);
                scheduleReconnect({ error });
                return null;
            })
            .finally(() => {
                if (opening === pending) opening = null;
            });

        opening = pending;
        return pending;
    };

    return {
        start() {
            if (running) return opening ?? Promise.resolve(socket);
            running = true;
            retries = 0;
            return openSocket();
        },
        stop,
        getSocket: () => socket,
        get isRunning() { return running; },
        get retryCount() { return retries; }
    };
};
