import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { createSocketSupervisor } from '../lib/Utils/auto-reconnect.js';

const makeSocket = () => {
    const ev = new EventEmitter();
    return { ev, end() {} };
};

const closeSocket = (socket, statusCode) => {
    socket.ev.emit('connection.update', {
        connection: 'close',
        lastDisconnect: { error: { output: { statusCode } } }
    });
};

test('reconnects after a transient disconnect', async () => {
    const sockets = [];
    let resolveSecondSocket;
    const secondSocket = new Promise(resolve => {
        resolveSecondSocket = resolve;
    });
    const supervisor = createSocketSupervisor(() => {
        const socket = makeSocket();
        sockets.push(socket);
        return socket;
    }, {
        initialDelayMs: 1,
        maxDelayMs: 1,
        jitter: 0,
        onSocket(socket) {
            if (sockets.length === 2) resolveSecondSocket(socket);
        }
    });

    const firstSocket = await supervisor.start();
    closeSocket(firstSocket, 408);

    assert.equal(await secondSocket, sockets[1]);
    assert.equal(supervisor.getSocket(), sockets[1]);
    supervisor.stop();
});

test('does not retry a logged-out session or clear auth state', async () => {
    let socketCount = 0;
    let authRequired;
    const authRequiredEvent = new Promise(resolve => {
        authRequired = resolve;
    });
    const supervisor = createSocketSupervisor(() => {
        socketCount++;
        return makeSocket();
    }, {
        initialDelayMs: 1,
        maxDelayMs: 1,
        jitter: 0,
        onAuthRequired: authRequired
    });

    const socket = await supervisor.start();
    closeSocket(socket, 401);
    const details = await authRequiredEvent;

    assert.equal(details.statusCode, 401);
    assert.equal(supervisor.isRunning, false);
    assert.equal(socketCount, 1);
    supervisor.stop({ closeSocket: false });
});

test('can restart while a previous socket factory is still pending', async () => {
    const resolvers = [];
    const sockets = [];
    const supervisor = createSocketSupervisor(() => new Promise(resolve => resolvers.push(resolve)), {
        onSocket(socket) {
            sockets.push(socket);
        }
    });

    const firstAttempt = supervisor.start();
    supervisor.stop({ closeSocket: false });
    const secondAttempt = supervisor.start();
    await Promise.resolve();
    const activeSocket = makeSocket();
    resolvers[1](activeSocket);

    assert.equal(await secondAttempt, activeSocket);
    const staleSocket = makeSocket();
    resolvers[0](staleSocket);
    await firstAttempt;

    assert.equal(supervisor.getSocket(), activeSocket);
    assert.deepEqual(sockets, [activeSocket]);
    supervisor.stop();
});

test('validates retry options', () => {
    assert.throws(() => createSocketSupervisor(() => makeSocket(), { jitter: 2 }), RangeError);
    assert.throws(() => createSocketSupervisor(null), TypeError);
});
