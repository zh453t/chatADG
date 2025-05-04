'use strict';
import * as model from './model.js';
import * as views from './views.js';
import { Reply, Rating } from './structs.js';

/**
 * 初始化消息
 */
const initMessage = () => {
	model
		.get('messages')
		.then((messages) => {
			// 检查
			if (messages.length === 0) {
				console.info('没有消息');
				return;
			}

			// 渲染视图
			views.chatView.render(messages);
		})
		.catch(console.error);
};

/**
 * 发送消息
 * @param {Message} inputMessage
 */
const sendMessage = function (inputMessage) {
	// 检查
	if (inputMessage.hasEmptyValues) {
		alert('用户名或消息不能为空 ');
		return;
	}

	// 清除
	views.inputView.clear();

	// 发送
	model.send({ type: 'message', data: inputMessage });
};

/**
 * 初始化评分
 */
const initRatings = () => {
	model
		.get('ratings')
		.then((data) => {
			// 渲染
			views.ratingsView.render(data);
		})
		.catch(console.error);
};

/**
 * 发送评分 (Controller)
 * @param {string} id
 */
const sendRating = (id) => {
	const value = parseInt(prompt('给出你的评分'));
	const rating = new Rating({ id, value });
	// 检查评分是否合规
	if (!rating.isValid) {
		console.warn('评分不合规');
		return;
	}

	// 发送
	model.send({ type: 'rating', data: rating });
	// 等收到 broadcast 后再渲染
};

/**
 * 初始化回复
 */
const initReply = () => {
	model.get('replies').then((replies) => {
		views.replyView.render(replies);
	});
};

/**
 * 发送回复
 * @param {string} id - 目标消息的 ID
 */
const sendReply = (id) => {
	// 获取回复
	const text = prompt('回复：');
	if (!text) return;
	const reply = new Reply({ text, to: id });

	console.info('new reply', reply);
	// 发送
	model.send({ type: 'reply', data: reply });
	// 等收到 broadcast 后再渲染
};

// bind events
views.inputView.oninput(sendMessage);
views.ratingsView.onclick(sendRating);
views.replyView.onreply(sendReply);

// 监听 WebSocket 消息
model.socket.addEventListener('message', (ev) => {
	let broadcastData;
	try {
		broadcastData = JSON.parse(ev.data);
		if (!broadcastData.type) throw new Error('no type');
	} catch (error) {
		console.error('解析 WebSocket 消息失败:', error);
	}
	switch (broadcastData.type) {
		case 'message': {
			views.chatView.append(broadcastData.data);
			break;
		}
		case 'rating': {
			views.ratingsView.render(Object.fromEntries([[broadcastData.data.id, broadcastData.data.ratings]]));
			break;
		}
		case 'reply': {
			const replies = Object.fromEntries([[broadcastData.data.id, broadcastData.data.replies]]);
			views.replyView.render(replies);
			break;
		}
		default: {
			console.warn('未知类型的消息:', broadcastData);
		}
	}
});

// 初始化
initMessage();
// 2. 更新评分
initRatings();
// 3. 更新回复
initReply();
