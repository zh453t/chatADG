import config from '../config.js';

export const state = {
	ratings: [],
};

// -- websocket --
export const socket = new WebSocket(`${config.hostname}:${config.port.websocket}`);

// -- http --
/**
 * GET
 * @param {string} type
 * @returns {Promise<Message[] | {id, ratings}[] | Reply[]>} 
 */
export const get = async (type) => {
	try {
		const res = await fetch(`./api/${type}`);

		if (!res.ok) {
			throw new Error(`请求失败：${res.status} ${res.statusText}`);
		}

		const result = await res.json();

		if (!result.data) {
			throw new Error(`格式错误。预期为 { data: [] }`);
		}

		return result.data;
	} catch (error) {
		console.error(`获取 ${type} 出错：`, error);
		return []; // 或根据需要返回 null、抛出异常等
	}
};


/**
 * POST
 * @param {{type: string, data: Message | Reply | Rating}} data
 */
export const send = (data) => {
	// 错误处理
	if (!socket.readyState === WebSocket.OPEN) {
		throw new Error('Websocket is closed');
	}

	// 使用 socket 发送
	socket.send(JSON.stringify(data));
};
