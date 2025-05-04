import { serveDir } from 'https://deno.land/std@0.200.0/http/file_server.ts';
import config from './pub/config.js';

const kv = await Deno.openKv();

const wsConnections = new Set();

const getMessages = async () => {
	const entries = kv.list({ prefix: ['message'] });
	const messages = [];
	for await (const entry of entries) {
		messages.push(entry.value);
	}
	return messages;
};

const getRatings = async (id) => {
	const result = await kv.get(['rating', id]);
	return result.value || [];
};

const getReplies = async (id) => {
	const result = await kv.get(['reply', id]);
	return result.value || [];
};

/*
-- POST --

*/

const saveMessage = async (message) => {
	await kv.set(['message', message.id], message);
};

const saveRating = async (id, value) => {
	const ratings = await getRatings(id);
	ratings.push(value);
	await kv.set(['rating', id], ratings);
};

const saveReply = async (id, reply) => {
	const replies = await getReplies(id);
	replies.push(reply);
	await kv.set(['reply', id], replies);
};

const broadcast = (broadcastData) => {
  console.log('broadcast: ', broadcastData)
  wsConnections.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(broadcastData))
};

const handler = (req) => {
	const url = new URL(req.url);
	const pathParts = url.pathname.split('/').filter(Boolean);

	// websocket
	if (req.headers.get('upgrade') === 'websocket') {
		const { socket, response } = Deno.upgradeWebSocket(req);

		socket.onopen = () => {
			console.info(`[WebSocket] NEW CONNECTION on ${url.host}`);
			wsConnections.add(socket);
		};

		socket.onmessage = async (event) => {
			try {
				const { type, data } = JSON.parse(event.data);

        console.log('WebSocket received:', data)
				if (type === 'message') {
					await saveMessage(data);
					const broadcastData = JSON.stringify({ type, data });
					broadcast(broadcastData);
				} else if (type === 'rating') {
					await saveRating(data.id, data.value);
					const ratings = await getRatings(data.id);
					const broadcastData = JSON.stringify({ type, data: { id: data.id, ratings } });
					broadcast(broadcastData);
				} else if (type === 'reply') {
					await saveReply(data.to, data);
					const replies = await getReplies(data.to);
					const broadcastData = JSON.stringify({ type, data: { id: data.to, replies } });
					broadcast(broadcastData);
				} else {
					throw new Error('Invalid data type');
				}
			} catch (error) {
				console.error('[WebSocket] Error processing message:', error);
			}
		};

		socket.onclose = () => {
			wsConnections.delete(socket);
			console.info('[WebSocket] CONNECTION CLOSED');
		};

		socket.onerror = (error) => {
			console.error('[WebSocket] ERROR:', error);
		};

		return response;
	}

	// GET: static
	if (pathParts.length === 0 || pathParts[0] !== 'api') {
		return serveDir(req, {
			fsRoot: config.dirs.static,
			urlRoot: '',
		});
	}

	// GET: api
	const type = pathParts[1];
	const id = pathParts[2];

	return (async () => {
		try {
			if (type === 'messages') {
				const data = await getMessages();
				return new Response(JSON.stringify({ type, data }), {
					headers: { 'Content-Type': 'application/json' },
				});
			} else if (type === 'ratings') {
				// api/ratings/:id
				if (id) {
					const data = await getRatings(id);
					return new Response(JSON.stringify({ type, id, data }), {
						headers: { 'Content-Type': 'application/json' },
					});
				} else {
					// api/ratings
					const entries = kv.list({ prefix: ['rating'] });
					const allRatings = {};
					for await (const entry of entries) {
						const id = entry.key[1];
						allRatings[id] = entry.value;
					}
					return new Response(JSON.stringify({ type, data: allRatings }), {
						headers: { 'Content-Type': 'application/json' },
					});
				}
			} else if (type === 'replies') {
				// api/replies/:id
				if (id) {
					const data = await getReplies(id);
					return new Response(JSON.stringify({ type, id, data }), {
						headers: { 'Content-Type': 'application/json' },
					});
				} else {
					// api/replies
					const entries = kv.list({ prefix: ['reply'] });
					const allReplies = {};
					for await (const entry of entries) {
						const id = entry.key[1];
						allReplies[id] = entry.value;
					}
					return new Response(JSON.stringify({ type, data: allReplies }), {
						headers: { 'Content-Type': 'application/json' },
					});
				}
			} else {
				return new Response('Invalid data type', { status: 400 });
			}
		} catch (error) {
			console.error(`[HTTP] Error getting ${type}:`, error);
			return new Response('Internal server error', { status: 500 });
		}
	})();
};

const port = parseInt(Deno.env.get('PORT')) || config.port.http;
const hostname = config.hostname;

Deno.serve({ port, hostname }, handler);
console.log(`Server running on ${hostname}:${port}`);
