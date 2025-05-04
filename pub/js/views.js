'use strict';
import { Message, Rating } from './structs.js';

// 消息
class ChatView {
	msgContainer = document.querySelector('ul.msg');

	/**
	 * 生成消息元素
	 * @param {Message} message - 消息
	 * @returns {HTMLElement} - 返回一个消息元素
	 * */
	#generateElement(message) {
		// 创建外部的 <li> 元素
		const msgEl = document.createElement('li');
		msgEl.classList.add('chat-content');
		msgEl.dataset.id = message.id;

		// 创建 msg-main 部分
		const msgMain = document.createElement('section');
		msgMain.classList.add('msg-main');

		// 时间处理
		const date = new Date(message.time).toLocaleString();
		const smallerText = document.createElement('div');
		smallerText.classList.add('msg-info');

		const infoCellTime = document.createElement('div');
		infoCellTime.classList.add('info-cell');
		infoCellTime.innerHTML = date;

		const infoCellUser = document.createElement('div');
		infoCellUser.classList.add('info-cell');
		infoCellUser.innerHTML = `<span class="msg-user">${message.user}</span>`;

		smallerText.appendChild(infoCellTime);
		smallerText.appendChild(infoCellUser);

		// 创建 msg-content 部分
		const mainMsg = document.createElement('div');
		mainMsg.classList.add('msg-content');
		if (message.text.includes('\n')) {
			mainMsg.classList.add('return');
			const pContent = document.createElement('p');
			// ???
			pContent.innerHTML = message.text.replaceAll('\n\n', '\n').replaceAll('\n', '</p><p>');
			mainMsg.appendChild(pContent);
		} else {
			const pContent = document.createElement('p');
			pContent.textContent = message.text;
			mainMsg.appendChild(pContent);
		}

		// 创建 ratingBar 部分
		const ratingBar = document.createElement('section');
		ratingBar.classList.add('ratingBlock');
		ratingBar.dataset.id = message.id;

		const rating = document.createElement('div');
		rating.classList.add('rating');
		rating.textContent = '--';

		const ratingBarInner = document.createElement('div');
		ratingBarInner.classList.add('ratingBar');
		const ratingInnerDiv = document.createElement('div');
		ratingBarInner.appendChild(ratingInnerDiv);

		ratingBar.appendChild(rating);
		ratingBar.appendChild(ratingBarInner);

		// 创建 reply 列表
		const replyList = document.createElement('ul');
		replyList.classList.add('reply');

		// 将子元素插入到 msgEl 中
		msgMain.appendChild(mainMsg);
		msgMain.appendChild(smallerText);
		msgEl.appendChild(msgMain);
		msgEl.appendChild(ratingBar);
		msgEl.appendChild(replyList);

		return msgEl;
	}

	/**
	 * 渲染消息
	 * @param {Message[]} messages - 消息数组
	 */
	render(messages) {
		// 创建文档片段。将每条消息分别添加到文档片段中，然后倒序添加到 DOM 中，保证时间靠后的消息靠前显示
		const fragments = [];
		messages.forEach((message) => {
			const fragment = document.createDocumentFragment();
			fragment.appendChild(this.#generateElement(message));
			fragments.push(fragment);
		});
		fragments.forEach((fragment) => {
			this.msgContainer.prepend(fragment);
		});
	}

	/**
	 * 添加消息
	 *	@param {Message} message - 消息
	 * */
	append(message) {
		const childNodes = this.msgContainer.children;
		const fragment = this.#generateElement(message);
		this.msgContainer.insertBefore(fragment, childNodes[0]);
	}
}

// 回复
class ReplyView extends ChatView {
	constructor() {
		super();
	}
	msgContainer = document.querySelector('ul.msg');

	/**
	 * 生成回复元素
	 * @param {Reply} reply - 回复
	 * @returns {HTMLElement} - 返回一个回复元素
	 * */
	#generateElement(reply) {
		const replyEl = document.createElement('li');
		replyEl.classList.add('reply-msg');

		const replyContent = document.createElement('section');
		replyContent.classList.add('reply-content');
		replyContent.textContent = reply.text;

		const replyInfo = document.createElement('section');
		replyInfo.classList.add('reply-info');

		const infoCell = document.createElement('div');
		infoCell.classList.add('info-cell');
		const time = new Date(reply.time).toLocaleString();
		infoCell.innerHTML = time;

		replyInfo.appendChild(infoCell);

		replyEl.appendChild(replyContent);
		replyEl.appendChild(replyInfo);

		return replyEl;
	}

	/**
	 * 渲染回复
	 * 格式 `{<id>: [{text, user, time, to}, ...], ...}`
	 */
	render(replyCollection) {
		for (const [id, replies] of Object.entries(replyCollection)) {
			// 获取回复的容器
			const container = this.msgContainer.querySelector(`.chat-content[data-id="${id}"] ul.reply`);
			if (!container) return console.warn('reply for an unknown message.');
			// 添加回复，按时间倒序
			replies.forEach((reply) => {
				container.prepend(this.#generateElement(reply));
			});
		}
	}

	/**
	 * 在页面上清除特定id的回复
	 * clear reply by message id
	 * @param {string} id
	 */
	clear(id) {
		const container = this.msgContainer.querySelector(`.chat-content[data-id="${id}"] ul.reply`);
		if (!container) return console.warn(`reply for an unknown message (id: ${id}).`);
		container.innerHTML = '';
	}

	/**
	 * 回复事件监听器
	 * Reply event listener
	 * @param {function} handler
	 */
	onreply(handler) {
		this.msgContainer.addEventListener('click', (e) => {
			const clickedElement = e.target.closest('.chat-content');
			if (clickedElement === null || e.target.closest('.ratingBlock')) return;
			const id = clickedElement.dataset.id;
			handler(id);
		});
	}
}

// 评分
class RatingsView {
	get #ratingContainers() {
		return [...document.querySelectorAll('.ratingBlock')];
	}
	chatContainer = document.querySelector('ul.msg');

	/**
	 * <section class="ratingBlock"> 事件监听器 | .ratingBlock click event listener
	 * @param {function} handler
	 */
	onclick(handler) {
		this.chatContainer.addEventListener('click', (e) => {
			const ratingBlock = e.target.closest('.ratingBlock');
			if (!ratingBlock) return;
			const id = ratingBlock.dataset.id;
			handler(id);
		});
	}

	/**
	 * 渲染评分
	 * 格式：`{'weh3r124': [10,100,...], ...s}`
	 */
	render(ratings) {
		for (const [id, rating] of Object.entries(ratings)) {
			const { container, bar } = this.#getRatingElements(id);
			if (!container || !bar) return;
			this.#updateRatingUI(container, bar, rating);
		}
	}

	/**
	 * 查找评分相关的元素
	 * @param {string} id - 评分 ID
	 * @returns {{ container: HTMLElement | null, bar: HTMLElement | null }} - 返回找到的元素
	 */
	#getRatingElements(id) {
		// 找到评分容器
		const container = this.#ratingContainers.find((el) => el.dataset.id === id);
		if (!container) {
			console.warn('rating block not found');
			return { container: null, bar: null };
		}

		// 找到评分条
		const bar = container.querySelector('.ratingBar div');
		if (!bar) {
			console.warn('rating bar not found');
			return { container: null, bar: null };
		}

		return { container, bar };
	}

	/**
	 * 更新评分 UI
	 * @param {HTMLElement} container - 评分容器
	 * @param {HTMLElement} bar - 评分条
	 * @param {number[]} rating - 评分数组
	 */
	#updateRatingUI(container, bar, rating) {
		const avg = Rating.calcAvg(rating);
		container.querySelector('.rating').innerHTML = `${avg}`;
		this.#renderBar(bar, avg);
	}

	/**
	 * 渲染彩色小条
	 * @param {Element} ratingBar
	 * @param {Number} ratingValue
	 */
	#renderBar(ratingBar, ratingValue) {
		ratingBar.style.width = `${ratingValue}%`;

		if (ratingValue < 60) ratingBar.classList.add('red');
		else if (ratingValue < 80) ratingBar.classList.add('yellow');
		else ratingBar.classList.add('green');
	}
}

// 表单
class InputView {
	#form = document.querySelector('form');
	#inputEl = this.#form.querySelector('form textarea');
	#userEl = this.#form.querySelector(`input[name="user"]`);

	/**
	 * 文本输入时执行传入的函数
	 * @param {function} eventListener
	 */
	oninput(eventListener) {
		const handler = function (e) {
			e.preventDefault();
			eventListener(this.inputMessage);
		};
		this.#form.addEventListener('submit', handler.bind(this));
	}

	/**
	 * 清空输入框
	 */
	clear() {
		this.#inputEl.value = '';
	}

	/**
	 * 获取输入的消息
	 * @returns {Message} 消息对象
	 * */
	get inputMessage() {
		const data = new FormData(this.#form);
		const obj = Object.fromEntries(data.entries());
		return new Message(obj);
	}
}

// 时间
class Time {
	#timeElement = document.querySelector('#time');
	/**
	 * render time
	 * @param {string} time locale time string
	 */
	#render(time) {
		this.#timeElement.textContent = time;
	}
	constructor() {
		this.#render(new Date().toLocaleTimeString());
		// 1. 获取现在的毫秒数
		const mStart = new Date().getMilliseconds();
		// 2. 校准时间
		setTimeout(() => {
			setInterval(() => {
				this.#render(new Date().toLocaleTimeString());
			}, 1000);
		}, 1000 - mStart); //😎
	}
}

export const inputView = new InputView();
export const chatView = new ChatView();
export const replyView = new ReplyView();
new Time();
export const ratingsView = new RatingsView();
