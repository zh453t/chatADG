import config from '../config.js';

export const state = {
	ratings: [],
};

// -- websocket --
export const socket = new WebSocket(`${config.protocols.websocket}://${location.hostname}:${config.port.websocket}`);

// -- http --
/**
 * get everyting
 * @param {string} type
 * @returns {Promise<Message[] | {id, ratings}[] | Reply[]>} promise from fetch()
 */
export const get = (type) =>
	fetch(`./api/${type}`)
		.then((res) => res.json())
		.then((data) => data.data);

/**
 * send everyting
 * @param {Message | Reply | Rating} data
 */
export const send = (data) => {
	// 错误处理
	if (!socket.readyState === WebSocket.OPEN) {
		throw new Error('Websocket is closed');
	}

	// 使用 socket 发送
	socket.send(JSON.stringify(data));
};
