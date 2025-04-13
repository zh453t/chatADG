export default {
  // Deno Deploy 会自动分配端口，通常不需要指定
  port: {
    http: 443,    // 使用环境变量或默认443
    websocket: 443 // WebSocket 与 HTTP 同端口
  },

  // Deno Deploy 需要监听 0.0.0.0
  hostname: '0.0.0.0',

  // 自动根据部署环境判断是否启用 HTTPS
  secure: Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined,

  // 静态文件目录（Deno Deploy 需要相对路径）
  dirs: {
    static: './pub'
  },

  // 协议自动判断
  get protocols() {
    const isDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
    return {
      http: isDeploy || this.secure ? 'https' : 'http',
      websocket: isDeploy || this.secure ? 'wss' : 'ws'
    };
  },

  // Deno Deploy 特定配置
  get deployConfig() {
    return {
      // 静态文件缓存策略（Deno Deploy 特性）
      staticCache: {
        edgeTTL: 3600,    // CDN 边缘缓存1小时
        browserTTL: 300   // 浏览器缓存5分钟
      },
      // 是否启用 Deno Deploy 的全局 KV
      useGlobalKV: true
    };
  }
};