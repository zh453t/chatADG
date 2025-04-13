export default {
  port: {
    http: 443,
    websocket: 443
  },

  // Deno Deploy 需要监听 0.0.0.0
  hostname: '0.0.0.0',

  // 静态文件目录（Deno Deploy 需要相对路径）
  dirs: {
    static: './pub'
  },

  // 协议自动判断
  get protocols() {
    return {
      http: 'https',
      websocket: 'wss'
    };
  },

};