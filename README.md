<div align="center">

# Mickeyteam / Baileys

A maintained, ESM-first Baileys fork for WhatsApp Multi-Device bots on Node.js.

[![npm version](https://img.shields.io/npm/v/@mickeyteam/baileys?label=NPM&color=303846)](https://www.npmjs.com/package/@mickeyteam/baileys)
[![downloads](https://img.shields.io/npm/dt/@mickeyteam/baileys?label=Downloads&color=303846)](https://www.npmjs.com/package/@mickeyteam/baileys)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-303846)](https://nodejs.org/)
[![Module](https://img.shields.io/badge/Module-ESM-303846)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![License](https://img.shields.io/badge/License-MIT-303846)](LICENSE)

[Documentation](#documentation-map) · [Installation](#installation) · [Examples](#sending-messages) · [Issues](https://github.com/Mickeydeveloper/Mickey-Bailey/issues)

</div>

---

## Project Overview

`@mickeyteam/baileys` is an unofficial WhatsApp Multi-Device library for Node.js. It builds on the Baileys ecosystem and adds Mickeyteam-specific helpers, compatibility improvements, interactive messaging support, and an integrated MessageBuilder layer.

The package combines the socket API, protocol utilities, LID-aware addressing, and message builders in one dependency. Use buttons, native-flow messages, carousels, and AIRich layouts without installing a separate builder package.

> [!IMPORTANT]
> This project is unofficial and is not affiliated with, authorized by, maintained by, sponsored by, or supported by WhatsApp or Meta. Use it responsibly and comply with WhatsApp's Terms of Service and applicable laws.

> [!NOTE]
> Advanced features may depend on the account, server-side rollout, device type, permissions, and current WhatsApp client version.

## Highlights

| Feature | Description |
|---|---|
| Multi-Device | Connect to WhatsApp using the Baileys Multi-Device protocol. |
| Pairing codes | Supports standard and custom 8-character pairing codes. |
| Interactive buttons | Quick replies, URLs, copy, call, list/select, location, and other native-flow buttons. |
| Integrated MessageBuilder | `Button`, `ButtonV2`, `Carousel`, `AIRich`, and `Toolkit` are included. |
| Albums | Send multiple images or videos as one album message. |
| Channels | Create, follow, update, react to, and fetch WhatsApp Channel data. |
| Groups | Create groups, manage members, read metadata, update descriptions, and more. |
| LID / PN addressing | Supports LID addressing and WhatsApp-provided PN/JID alternatives. |
| Profile pictures | Fetch, update, and remove profile pictures. |
| AI Rich | Experimental rich-response builder for text, code, tables, media, suggestions, and layouts. |
| Voice and video calls | Make audio and video calls and share screens in an existing bot session. |
| Database sessions | Store sessions in SQLite, PostgreSQL, MySQL, MongoDB, Redis, or NekoDB. |
| ESM | ESM-first package requiring Node.js 20 or newer. Node.js 22+ is recommended. |

## Documentation Map

| I want to… | Use | Read |
|---|---|---|
| Log in and stay logged in | `useMultiFileAuthState`, database auth helpers | [Session storage](#session-storage) |
| Log in without scanning a QR code | Pairing code | [Pairing codes](#pairing-code) |
| Respond to incoming messages | `messages.upsert` | [Receiving messages](#receiving-messages) |
| Send text, media, locations, and polls | `sock.sendMessage` | [Sending messages](#sending-messages) |
| Send buttons, lists, and carousels | `Button`, `ButtonV2`, `Carousel` | [Interactive messages](#interactive-messages) |
| Manage groups or communities | Group and community helpers | [Groups and communities](#groups-and-communities) |
| Manage channels | Newsletter helpers | [Newsletters and channels](#newsletters-and-channels) |
| Work with LID and PN identifiers | Addressing helpers | [LID / PN / JID addressing](#lid--pn--jid-addressing) |
| Diagnose common problems | Troubleshooting guide | [Troubleshooting](#troubleshooting) |

## Requirements

- Node.js 20 or newer. This requirement is declared in `package.json` and enforced during installation.
- Node.js 22 or newer is recommended; Node.js 24 is recommended for development and release workflows.
- npm
- A WhatsApp account for pairing and login

Check your Node.js version:

```bash
node -v
```

## Installation

Install the package from npm:

```bash
npm install @mickeyteam/baileys
```

This package is ESM-first. Use `import` syntax instead of `require()`.

A minimal `package.json` setup looks like this:

```json
{
  "type": "module",

VoIP runs on the socket that is already logged in. FFmpeg must be installed and available on `PATH` for audio/video file playback; set `ffmpegPath` if it is installed elsewhere.

```js
import { makeVoipClient } from '@mickeyteam/baileys'

const voip = await makeVoipClient(sock, { ffmpegPath: 'ffmpeg' })
const call = await voip.call('6281234567890', {
  audioSource: './audio/intro.mp3',
  playlist: ['./audio/intro.mp3', './audio/next.mp3'],
  durationMs: 0
})

call.enqueue('./audio/another-track.mp3')
call.skip()
await call.end()
voip.disconnect()
```

Video calls accept `video: true`, `videoSource`, and `videoPlaylist`. Screen-sharing mode can be started with `screenShare: true` or toggled on an active call, but the library does not automatically capture the machine's desktop; a video source/capture integration is still needed. VoIP behavior should be tested on the target platform and account.

  "dependencies": {
    "@mickeyteam/baileys": "latest"
  }
}
```

### Optional Media Packages

The base installation does not include image or video processing libraries. This keeps the package smaller and lets you choose the `sharp` build that fits your project.

```bash
npm install sharp
npm install fluent-ffmpeg
```

| Package | Used for |
|---|---|
| `sharp` | Preferred image processing library; generally the fastest option. |
| `@napi-rs/image` | Fallback image processing library. |
| `jimp` | Pure JavaScript fallback without a native build. |
| `fluent-ffmpeg` | Video frame previews. |

Sending text, buttons, polls, channel messages, and AI Rich messages does not require these packages. Media processing without an available image library throws `No image processing library available`. `Toolkit.resize` and `Toolkit.getMp4Preview` report the package they require when unavailable.

Check for optional dependencies at runtime:

```js
import { hasOptionalMedia } from '@mickeyteam/baileys'

await hasOptionalMedia('sharp')
await hasOptionalMedia('fluent-ffmpeg')
```

## Imports

Import the socket:

```js
import makeWASocket from '@mickeyteam/baileys'
```

Import additional utilities as needed:

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB,
  createSocketSupervisor
} from '@mickeyteam/baileys'
```

> [!NOTE]
> MessageBuilder is integrated into this package. You do not need to install `baileys-mbuilder` separately.

## Basic Connection

```js
import makeWASocket, {
  useMultiFileAuthState,
  createSocketSupervisor
} from '@mickeyteam/baileys'
import pino from 'pino'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const supervisor = createSocketSupervisor(() => {
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' })
  })
  sock.ev.on('creds.update', saveCreds)
  return sock
}, {
  onUpdate({ connection, qr }) {
    if (qr) console.log('Scan the QR code:', qr)
    if (connection === 'open') console.log('WhatsApp connected')
  },
  onReconnect({ attempt, delayMs, statusCode }) {
    console.log(`Reconnect ${attempt} in ${delayMs}ms (status ${statusCode ?? 'unknown'})`)
  },
  onAuthRequired({ statusCode }) {
    console.error(`Session needs to be paired again (status ${statusCode})`)
  },
  onError(error) {
    console.error('Socket creation failed:', error)
  }
})

await supervisor.start()
```

The supervisor retries transient disconnects with exponential backoff. It does not erase auth files or try to bypass a logout. If WhatsApp revokes the session, pair the device again, then call `supervisor.start()` with the refreshed auth state. Use `supervisor.stop()` during shutdown.

### Opt-in project banner

You can show a startup banner in your app logs by enabling the socket's `branding` option:

```js
const sock = makeWASocket({
  auth: state,
  logger: pino({ level: 'info' }),
  branding: true
})
```

For a custom message:

```js
const sock = makeWASocket({
  auth: state,
  logger: pino({ level: 'info' }),
  branding: {
    message: 'THANKS FOR USING MY BOT. CONTACT: +1234567890'
  }
})
```

By default the banner is off to keep normal startup logs quiet.

### Retry and Pairing Options

These options control handling of undecryptable messages, rejected sends, and pairing:

| Option | Default | Description |
|---|---:|---|
| `maxMsgRetryCount` | `3` | Decryption retry requests per incoming message. |
| `retryRequestDelayMs` | `250` | Delay before asking the sender to re-encrypt. |
| `maxRetryQueueSize` | `64` | Maximum messages queued for retry at one time. |
| `ackRetryDelayMs` | `750` | Delay before retrying after a retryable NACK. |
| `maxAckRetryCount` | `3` | Retry attempts after a retryable NACK. |
| `pairingCodeTimeoutMs` | `180000` | Validity period for one pairing code. |

`maxRetryQueueSize` limits memory growth during bursts of undecryptable messages. Messages beyond the limit are acknowledged without retrying. Raising the limit does not improve message recovery; `retryRequestDelayMs` controls how quickly retry requests are sent.

### Socket Options

`makeWASocket` accepts the following options in addition to the standard Baileys options:

| Option | Default | Description |
|---|---|---|
| `auth` | — | Required auth state from one of the session stores below. |
| `logger` | Pino instance | Any Pino-compatible logger. |
| `version` | Pinned WA Web version | Protocol version claimed by the socket. |
| `browser` | `['Mac OS', 'Chrome', '14.4.1']` | Client name displayed in Linked Devices. |
| `markOnlineOnConnect` | `true` | Set to `false` to preserve phone notification behavior. |
| `syncFullHistory` | `true` | Request full history instead of only recent messages. |
| `shouldSyncHistoryMessage` | `() => true` | Decide whether to save each history batch. |
| `shouldIgnoreJid` | `() => false` | Drop events from matching JIDs before emitting them. |
| `getMessage` | `async () => undefined` | Retrieve old messages so the socket can answer retry requests. |
| `cachedGroupMetadata` | `async () => undefined` | Reuse a group metadata cache. |
| `emitOwnEvents` | `true` | Emit events for actions performed by this device. |
| `fireInitQueries` | `true` | Run initial queries for properties, blocklist, and privacy settings. |
| `generateHighQualityLinkPreview` | `true` | Fetch larger link preview thumbnails. |
| `linkPreviewImageThumbnailWidth` | `192` | Width of link preview thumbnails. |
| `connectTimeoutMs` | `20000` | Timeout for the socket handshake. |
| `keepAliveIntervalMs` | `15000` | WebSocket ping interval. |
| `defaultQueryTimeoutMs` | `60000` | Timeout for IQ queries. |
| `countryCode` | `'US'` | Country hint sent during registration. |
| `patchMessageBeforeSending` | — | Last chance to rewrite messages before relaying. |
| `enableAutoSessionRecreation` | `true` | Rebuild Signal sessions after repeated failures. |
| `enableRecentMessageCache` | `true` | Cache recent outbound messages for retry requests. |
| `appStateMacVerification` | `{ patch: false, snapshot: false }` | Configure app-state MAC verification. |
| `waWebSocketUrl` | WA Web endpoint | Override the WebSocket URL. |
| `customUploadHosts` | `[]` | Additional media upload hosts. |
| `inlineSenderKeyDistribution` | `true` | Include sender-key distribution in group messages. Set `false` to send it separately. |
| `transactionOpts` | `{ maxCommitRetries: 10, delayBetweenTriesMs: 3000 }` | App-state transaction retry policy. |
| `options` | `{}` | Axios options for HTTP requests, such as proxy, timeout, and headers. |
| `makeSignalRepository` | — | Override Signal protocol storage. |

`getMessage` is important for retry handling. Without it, a receiver requesting a message retry may have nothing to return, and the message can remain stuck as “waiting for this message.” Connect it to your message storage.

## Session Storage

Auth state stores credentials and Signal keys. Losing the state means pairing again; exposing it may give someone access to your account. The included stores return the same `{ state, saveCreds }` shape.

For every store, connect `saveCreds` to the `creds.update` event:

```js
sock.ev.on('creds.update', saveCreds)
```

### Multi-File (Default)

Multi-file storage is dependency-free and convenient for one bot on one machine:

```js
import { useMultiFileAuthState } from '@mickeyteam/baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
```

It writes many small files; thousands of pre-key files can be normal for a busy account. Do not delete them while the session is active, as doing so can break the session.

### Single-File

Single-file storage is easier to back up or move, but rewrites the full file when keys change and may slow down as the key collection grows:

```js
import { useSingleFileAuthState } from '@mickeyteam/baileys'

const { state, saveCreds } = await useSingleFileAuthState('./session.json')
```

### SQLite

SQLite stores keys in a database and supports concurrent reads and larger key collections. It requires `better-sqlite3` v11, v12, or v13:

```bash
npm install better-sqlite3
```

```js
import { useSqliteAuthState } from '@mickeyteam/baileys'

const { state, saveCreds } = await useSqliteAuthState({ dbPath: './session.db' })
```

You can pass an existing database connection:

```js
import Database from 'better-sqlite3'

const database = new Database('./bot.db')
const { state, saveCreds } = await useSqliteAuthState({ database })
```

The store creates `creds` and `signal_keys` tables on first use.

### PostgreSQL, MySQL, MongoDB, and Redis

These helpers work with existing database connections or connection details. Each stores data under a session name, so multiple accounts can share a database.

```bash
npm install pg mysql2 mongodb ioredis
```

```js
import {
  usePostgresAuthState,
  useMySQLAuthState,
  useMongoAuthState,
  useRedisAuthState
} from '@mickeyteam/baileys'

const postgres = await usePostgresAuthState({
  connectionString: 'postgres://user:pass@localhost:5432/bot'
})

const mysql = await useMySQLAuthState({
  uri: 'mysql://user:pass@localhost:3306/bot'
})

const mongo = await useMongoAuthState({
  uri: 'mongodb://localhost:27017',
  dbName: 'bot'
})

const redis = await useRedisAuthState({
  uri: 'redis://localhost:6379'
})
```

Pass an existing connection to share it with the rest of your application. For example:

```js
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const { state, saveCreds } = await usePostgresAuthState({ pool, session: 'sales-bot' })
```

`useMySQLAuthState` accepts `pool`; `useMongoAuthState` accepts `db` or `collection`; and `useRedisAuthState` accepts `client`. Both `node-redis` and `ioredis` are supported.

All four helpers return `clearAuth()` and `close()`. They close connections they opened themselves, but leave caller-provided connections untouched. `useSqliteAuthState` also returns both methods.

| Backend | Storage |
|---|---|
| PostgreSQL | `baileys_auth` table with `session`, `type`, `id`, and `value` fields. |
| MySQL | `baileys_auth` table with `session`, `type`, `id`, and `value` fields. |
| MongoDB | `baileys_auth` collection indexed by session, type, and id. |
| Redis | One hash per key type, using `baileys_auth:<session>:<type>`. |

Override the table, collection, or prefix with `table`, `collectionName`, or `prefix`. SQL writes are batched in a transaction, MongoDB uses `bulkWrite`, and Redis pipelines commands through `MULTI`.

### NekoDB

If your bot already stores state in NekoDB, use its auth helper:

```js
import { useNekoDBAuth } from '@mickeyteam/baileys'

const { state, saveCreds } = await useNekoDBAuth({ endpoint: '...', token: '...' })
```

### Caching Signal Keys

SQLite and multi-file stores read Signal keys from disk by default. For high-volume bots, wrap the auth state with an in-memory cache:

```js
import {
  useMultiFileAuthState,
  addMemoryCacheToAuthState
} from '@mickeyteam/baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const cachedState = addMemoryCacheToAuthState(state)

const sock = makeWASocket({ auth: cachedState })
```

This caches pre-keys and session state in memory to reduce disk I/O during busy message traffic.

### Storing Chats and Messages

Baileys does not include an internal database for chats, contacts, or message history by default. Store messages from the upsert event if your application needs them:

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  for (const msg of messages) {
    console.log('Received message:', msg.message)
    // Save msg to your database here.
  }
})
```

## Pairing Code

Instead of scanning a QR code, connect using an 8-character numeric pairing code:

```js
import makeWASocket, { useMultiFileAuthState } from '@mickeyteam/baileys'
import pino from 'pino'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({
  auth: state,
  logger: pino({ level: 'silent' })
})

sock.ev.on('creds.update', saveCreds)

if (!sock.authState.creds.registered) {
  const phoneNumber = '6281234567890' // No plus sign, spaces, or dashes.

  setTimeout(async () => {
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code: ${code}`)
  }, 3000)
}
```

WhatsApp generates the code on its servers. Enter it on your phone under **Linked Devices → Link a Device → Link with phone number instead**.

### One Code at a Time

Only one pairing code can be active per session. Requesting another code expires the previous one.

### Custom Pairing Code

A custom format or generator can be supplied through the options accepted by `requestPairingCode`:

```js
const code = await sock.requestPairingCode('6281234567890')
```

A custom code must be exactly eight characters.

### Check Pairing State

Check whether a session is registered before starting a full socket connection:

```js
import { useMultiFileAuthState } from '@mickeyteam/baileys'

const { state } = await useMultiFileAuthState('./session')
const isRegistered = state.creds?.registered ?? false

console.log(`Is session registered? ${isRegistered}`)
```

## Receiving Messages

Incoming messages arrive through the `messages.upsert` event:

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  for (const msg of messages) {
    if (!msg.message) continue

    const sender = msg.key.remoteJid
    const pushName = msg.pushName || 'User'
    console.log(`Message from ${pushName} (${sender}):`, msg.message)
  }
})
```

## Events

The `sock.ev` emitter provides hooks for connection state, messages, groups, and other updates.

| Event | Description |
|---|---|
| `connection.update` | Connection status changes, such as connecting, open, or close. |
| `creds.update` | Credentials change; persist them with `saveCreds`. |
| `messages.upsert` | New messages received or sent. |
| `messages.update` | Message status changes, such as delivered, read, or played. |
| `messages.delete` | Messages deleted for everyone or cleared. |
| `message-receipt.update` | Receipt updates for specific messages. |
| `chats.upsert`, `chats.update`, `chats.delete` | Chat state changes, including archive, pin, mute, and delete. |
| `contacts.upsert`, `contacts.update` | Contact details and profile name updates. |
| `groups.upsert` | Group metadata loaded or a group created. |
| `group-participants.update` | Members added, removed, promoted, or demoted. |
| `groups.update` | Group metadata changes, including subject, description, and settings. |
| `newsletter.update` | Channel updates, post reactions, and follower counts. |
| `call` | Incoming VoIP voice or video calls. |
| `presence.update` | Typing status and online/offline presence. |

## LID / PN / JID Addressing

WhatsApp uses more than one identifier for users:

- **PN (Phone Number JID):** the traditional format, such as `6281234567890@s.whatsapp.net`.
- **LID (Local Identifier):** a newer internal account identifier, such as `123456789@lid`.

`@mickeyteam/baileys` supports LID-aware addressing and WhatsApp-provided PN/JID alternatives. Use the addressing helpers when your application needs to resolve an identifier.

## Sending Messages

### Text

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', {
  text: 'Hello from Baileys!'
})
```

### Mentions

```js
await sock.sendMessage('123456789-group@g.us', {
  text: 'Hello @6281234567890!',
  mentions: ['6281234567890@s.whatsapp.net']
})
```

### Forwarding

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', {
  forward: messageObject
})
```

### Images and Video

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'Here is your image!'
})

await sock.sendMessage('6281234567890@s.whatsapp.net', {
  video: { url: 'https://example.com/video.mp4' },
  caption: 'Check out this video!'
})
```

### Documents

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', {
  document: { url: 'https://example.com/document.pdf' },
  mimetype: 'application/pdf',
  fileName: 'document.pdf'
})
```

### Location

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', {
  location: { degreesLatitude: -6.2, degreesLongitude: 106.816666 }
})
```

### Polls

```js
await sock.sendMessage('6281234567890@s.whatsapp.net', {
  poll: {
    name: 'What is your favorite programming language?',
    values: ['JavaScript', 'Python', 'TypeScript', 'Go']
  }
})
```

## Interactive Messages

### Quick Replies and URLs

```js
import { Button } from '@mickeyteam/baileys'

const jid = '6281234567890@s.whatsapp.net'
const buttonMessage = new Button(sock)
  .setTitle('Menu')
  .setBody('Choose an option below:')
  .addReply('Yes', 'yes_action')
  .addReply('No', 'no_action')
  .addUrl('Visit Website', 'https://example.com')

await buttonMessage.send(jid)
```

### Buttons with Images

```js
import { Button } from '@mickeyteam/baileys'

const jid = '6281234567890@s.whatsapp.net'
const buttonMessage = new Button(sock)
  .setImage('https://example.com/image.jpg')
  .setBody('Check this out!')
  .addReply('Buy Now', 'buy_now')

await buttonMessage.send(jid)
```

### Selection Lists

```js
import { Button } from '@mickeyteam/baileys'

const jid = '6281234567890@s.whatsapp.net'
const listMessage = new Button(sock)
  .setTitle('Menu')
  .setBody('Select an item from the list')
  .addSelection('Open Menu')
  .makeSection('Main Section')
  .makeRow('', 'Option 1', 'Description for option 1', 'opt_1')
  .makeRow('', 'Option 2', 'Description for option 2', 'opt_2')

await listMessage.send(jid)
```

### Carousels

```js
import { Carousel } from '@mickeyteam/baileys'

const jid = '6281234567890@s.whatsapp.net'
const carousel = new Carousel(sock)
  .addCard({
    image: { url: 'https://example.com/item1.jpg' },
    title: 'Item 1',
    body: 'Description for item 1',
    nativeFlowButtons: [{
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Select Item 1', id: 'item_1' })
    }]
  })
  .addCard({
    image: { url: 'https://example.com/item2.jpg' },
    title: 'Item 2',
    body: 'Description for item 2',
    nativeFlowButtons: [{
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: 'Select Item 2', id: 'item_2' })
    }]
  })
await carousel.send(jid)
```

### AIRich

```js
import { AIRich } from '@mickeyteam/baileys'

const jid = '6281234567890@s.whatsapp.net'
const aiRichMessage = new AIRich(sock)
  .addText('Here is the analysis you requested:')
  .addCode('javascript', 'console.log("Hello World");')

await aiRichMessage.send(jid)
```

Interactive components may render differently across WhatsApp clients and platforms. Some advanced layouts are experimental and may depend on server-side rollout.

## Albums

Album utilities bundle multiple images or videos into a single album message. See the package's message helpers for the supported album payload and media requirements.

## Newsletters and Channels

Channel helpers support creating and interacting with WhatsApp Channels (Newsletters):

```js
const newsletter = await sock.newsletterCreate({
  name: 'My Channel',
  description: 'Channel description'
})

console.log('Created channel:', newsletter)
```

The API also includes helpers for following channels, reading metadata and updates, reacting to posts, managing polls and status, and channel administration. Feature availability depends on the account and WhatsApp rollout.

## Groups and Communities

```js
const group = await sock.groupCreate('My Group', [
  '6281234567890@s.whatsapp.net'
])

await sock.groupParticipantsUpdate(
  'group_jid@g.us',
  ['6281234567891@s.whatsapp.net'],
  'add'
)

await sock.groupParticipantsUpdate(
  'group_jid@g.us',
  ['6281234567891@s.whatsapp.net'],
  'remove'
)
```

Group helpers cover participant management, metadata, descriptions, settings, and invite links. Community helpers are also available through the package API.

## Additional APIs

The package includes helpers for status messages and reactions, privacy and chat settings, labels and business catalogs, profile pictures, scheduled messages, account health signals, and call links. Advanced VoIP APIs support audio queues, video, screen sharing, and group calls. Availability can vary by account, client, and server-side rollout.

## Troubleshooting

### Cannot read properties of undefined when replying

This can result from an invalid message object or missing message context. Pass the original message in the `quoted` option when sending a reply.

### The bot answers in every group except one

Check whether the bot was removed from the group, whether `shouldIgnoreJid` filters that JID, or whether group settings restrict bot messages.

### Pairing code must be exactly 8 characters

Custom pairing codes must contain exactly eight characters.

### The pairing code appears, but the phone shows no prompt

Confirm the phone has an internet connection and choose **Linked Devices → Link a Device → Link with phone number instead** in the official WhatsApp app.

### Pairing request rejected with 409

A pairing session may already be active or conflict with another request. Wait briefly, then retry.

### Socket is required

Pass an initialized socket instance to methods that require `sock`.

### Buttons or AIRich render differently

WhatsApp client versions vary in their support for native-flow and rich components. Update the mobile app and account for platform differences.

### LID appears instead of a phone-number JID

This is expected as WhatsApp transitions to LID addressing. Use the library's addressing helpers when you need to resolve identifiers.

### Session logged out

Credentials may have expired, been revoked from the phone, or been modified or deleted. Pair the device again to create a fresh session.

## Development

Run the unit tests with Node.js 20 or newer:

```bash
npm test
```

GitHub Actions runs the test suite on Node.js 20, 22, and 24.

## Found a Bug?

Please open an issue in the [GitHub repository](https://github.com/Mickeydeveloper/Mickey-Bailey/issues).

## Credits

- **Project maintainers:** Mickeyteam
- **Baileys / upstream:** Built on the Baileys ecosystem.

## License

MIT License. See [LICENSE](LICENSE) for details.
