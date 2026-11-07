# LyncxTeams / Baileys

WhatsApp Web protocol toolkit for Node.js.

A maintained Baileys fork focused on Multi-Device automation, protocol helpers, session management, and a built-in MessageBuilder layer.

## Highlights

- Multi-Device WhatsApp sessions with QR and pairing code support
- ESM-first Node.js package for modern runtimes
- Session storage helpers for filesystem, SQLite, Postgres, MySQL, MongoDB, Redis, and more
- MessageBuilder utilities such as `Button`, `ButtonV2`, `Carousel`, and `AIRich`
- Support for groups, communities, newsletters, business tooling, and calls
- Extra protocol extensions and lower-level relay helpers

## Installation

```bash
npm install @lyncxteams/baileys
```

Node.js 20+ is required.

## Import

```js
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } from '@lyncxteams/baileys'
```

## Basic connection

```js
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } from '@lyncxteams/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  browser: Browsers.macOS('LyncxTeams Bot')
})

sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update

  if (qr) {
    console.log('Scan the QR code with WhatsApp')
  }

  if (connection === 'close') {
    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
    console.log('Connection closed due to', lastDisconnect?.error, 'reconnect:', shouldReconnect)
    if (shouldReconnect) setTimeout(() => process.exit(0), 1000)
  }

  if (connection === 'open') {
    console.log('Connected')
  }
})

sock.ev.on('creds.update', saveCreds)
```

## Session storage

This package provides several auth-state helpers. The simplest option is multi-file storage:

```js
import { useMultiFileAuthState } from '@lyncxteams/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info')
```

Other supported storage patterns include:

- `useSingleFileAuthState()`
- SQLite-backed auth stores
- PostgreSQL, MySQL, MongoDB, Redis, and NekoDB integration

## Pairing codes

Pairing codes let you connect without scanning a QR code.

```js
const { pairingCode, expiresIn } = await sock.requestPairingCode('YOUR_PHONE_NUMBER')
console.log(pairingCode, expiresIn)
```

You can also use custom pairing code flows when supported by the account and connection state.

## Receiving messages

```js
sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    if (msg.key.fromMe) continue

    console.log('From:', msg.key.remoteJid)
    console.log('Text:', msg.message?.conversation || msg.message?.extendedTextMessage?.text || '')
  }
})
```

## Sending messages

```js
await sock.sendMessage('1234567890@s.whatsapp.net', { text: 'Hello from LyncxTeams Baileys!' })
```

Common payloads include:

```js
await sock.sendMessage(jid, { image: { url: 'https://example.com/image.jpg' }, caption: 'Image caption' })
await sock.sendMessage(jid, { video: { url: 'https://example.com/video.mp4' }, caption: 'Video caption' })
await sock.sendMessage(jid, { document: { url: 'https://example.com/file.pdf' }, fileName: 'file.pdf', mimetype: 'application/pdf' })
await sock.sendMessage(jid, { location: { degreesLatitude: -6.2, degreesLongitude: 106.8 } })
await sock.sendMessage(jid, { poll: { name: 'Favorite language?', options: ['JavaScript', 'Python', 'Go'] } })
```

## Events

The socket emits a rich event stream:

```js
sock.ev.on('connection.update', update => console.log(update))
sock.ev.on('messaging-history.set', history => console.log(history))
sock.ev.on('messages.upsert', ({ messages }) => console.log(messages))
sock.ev.on('group-participants.update', event => console.log(event))
sock.ev.on('presence.update', event => console.log(event))
sock.ev.on('call.is-ongoing', event => console.log(event))
```

## MessageBuilder

This fork includes MessageBuilder helpers directly in the package.

```js
import { Button, ButtonV2, Carousel, AIRich, MB } from '@lyncxteams/baileys'

const msg = new Button().text('Choose an option')
  .button('Open', 'open')
  .button('Close', 'close')

await sock.sendMessage(jid, msg.toMessage())
```

For richer interactive cards:

```js
const rich = new MB.AIRich(sock).setTitle('LyncxTeams AI')
rich.addText('Hello from the bot')
await rich.send(jid)
```

## Groups and communities

```js
await sock.groupCreate('My Bot Group', [jid1, jid2])
await sock.groupParticipantsUpdate(groupId, [jid], 'add')
await sock.groupUpdateDescription(groupId, 'Updated description')
```

Community helpers are available as part of the same socket API.

## Newsletters and channels

```js
const metadata = await sock.newsletterMetadata('jid', '123456789@newsletter')
const newsletters = await sock.newsletterSubscribed()

await sock.newsletterFollow('123456789@newsletter')
await sock.newsletterReactMessage('123456789@newsletter', '175', '🔥')
```

## Calls and VoIP

```js
const call = await sock.createCallLink({ name: 'Support' })
await sock.rejectCall(call.callLink)
```

VoIP helpers are also exposed for more advanced audio and video call flows.

## LID, PN, and JID helpers

The library includes helpers for working with newer WhatsApp address formats alongside older JID-based flows.

```js
const contact = await sock.onWhatsApp('6281234567890@s.whatsapp.net')
console.log(contact)
```

## Private Relay and Web helpers

Private Relay and WhatsApp Web inspection helpers are included when supported by the account and session.

## Notes and limits

> [!IMPORTANT]
> This is an unofficial WhatsApp Web API library and is not affiliated with, authorized by, sponsored by, or supported by WhatsApp or Meta.

> [!NOTE]
> Availability of advanced features depends on the account, server-side rollout, device type, permissions, and the current WhatsApp client state.

## Troubleshooting

If you hit a problem:

- Make sure you are using Node.js 20 or newer
- Confirm the auth folder is writable and persisted between restarts
- Check the connection update logs for disconnect reasons and reconnect behavior
- Re-create auth state if session data becomes stale
- Use the relevant helper and feature gates before relying on experimental protocol features

## License

MIT
