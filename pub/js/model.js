import config from '../config.js';

export const state = {
    ratings: [],
};

// -- websocket --
export const socket = new WebSocket(`${config.protocols.websocket}://${location.hostname}:${config.port.websocket}`);

// -- http --
/**
 * get everything
 * @param {string} type 
 * @returns {Promise<Message[] | {id, ratings}[] | Reply[]>} promise from fetch()
 */
export const get = (type) => fetch(`./${type}`)
    .then(async (res) => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const text = await res.text();
        try {
          // 处理空响应或无效JSON的情况
          return text ? JSON.parse(text) : [];
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          return []; // 返回空数组而不是抛出错误
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        return []; // 网络错误时也返回空数组
    });

/**
 * send everything
 * @param {Message | Reply | Rating} data
 */
export const send = (data) => {
    // 错误处理
    if (socket.readyState !== WebSocket.OPEN) {
        console.error('Websocket is closed');
        return Promise.reject('Websocket is closed');
    }

    // 使用 socket 发送
    try {
        const jsonData = JSON.stringify(data);
        socket.send(jsonData);
        return Promise.resolve();
    } catch (e) {
        console.error('Failed to stringify data:', e);
        return Promise.reject(e);
    }
};

// 添加WebSocket错误处理
socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
});

// 添加WebSocket关闭处理
socket.addEventListener('close', (event) => {
    console.log('WebSocket closed:', event);
});