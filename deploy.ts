import { serveDir } from "https://deno.land/std@0.200.0/http/file_server.ts";
import config from "./pub/config.js";

// 初始化 KV
const isDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
const kv = await Deno.openKv(isDeploy ? undefined : "./local_kv.db");

// -- 类型定义和常量 --
type DataType = "message" | "rating" | "reply";
type DataMap = {
  message: Message;
  rating: Rating;
  reply: Reply;
};

interface Message {
  id: string;
  text: string;
  time: number;
  user: string;
}

interface Rating {
  id: string;
  ratings: number[];
}

interface Reply {
  text: string;
  user: string;
  time: number;
  id: string;
  to: string;
  content: string;
}

const KV_KEYS: Record<DataType, Deno.KvKey> = {
  message: ["messages"],
  rating: ["ratings"],
  reply: ["replies"],
};

// -- 数据访问层 --
const getData = async <T>(type: DataType): Promise<T[]> => {
  const result = await kv.get<T[]>(KV_KEYS[type]);
  return result.value || []; // 空值时返回 []
};

const saveData = async <T>(type: DataType, data: T[]): Promise<void> => {
  await kv.set(KV_KEYS[type], data);
};

// -- WebSocket 处理逻辑 --
const wsConnections = new Set<WebSocket>();

const handleRatingUpdate = (data: Rating, previousData: Rating[]) => {
  const target = previousData.find((r) => r.id === data.id);
  if (target) {
    target.ratings.push(...data.ratings);
  } else {
    previousData.push(data);
  }
  return previousData;
};

const updateKVData = async <T extends DataType>(type: T, data: DataMap[T]) => {
  try {
    const previousData = await getData<Rating>(type);
    const newData = type === "rating"
      ? handleRatingUpdate(data as Rating, previousData as Rating[])
      : [...previousData, data];

    await saveData(type, newData);
    return { type, data: newData };
  } catch (error) {
    console.error(`[WebSocket] Error updating ${type}:`, error);
    throw error;
  }
};

// -- 主请求处理器 --
const handler = (req: Request) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // WebSocket 连接处理
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.info(`[WebSocket] NEW CONNECTION on ${url.host}`);
      wsConnections.add(socket);
    };

    socket.onmessage = (event) => {
      (async () => {
        try {
          const rawData = JSON.parse(event.data);
          const type = rawData.type as DataType;

          if (!type || !KV_KEYS[type]) {
            throw new Error("Invalid data type");
          }

          const { type: _, ...payload } = rawData;
          const result = await updateKVData(type, payload); // 已经返回带type的数据

          // 广播时直接发送完整结构
          const broadcastData = JSON.stringify(result); // <-- 不再需要手动添加type
          wsConnections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(broadcastData);
            }
          });
        } catch (error) {
          console.error("[WebSocket] Error processing message:", error);
        }
      })();
    };

    socket.onclose = () => {
      wsConnections.delete(socket);
      console.info("[WebSocket] CONNECTION CLOSED");
    };

    socket.onerror = (error) => {
      console.error("[WebSocket] ERROR:", error);
    };

    return response;
  }

  // 静态文件服务
  if (pathParts.length === 0 || pathParts[0] !== 'api') {
    return serveDir(req, {
      fsRoot: config.dirs.static,
      urlRoot: "",
    });
  }

  // API 路由
  const type = pathParts[1] as DataType;
  if (!type || !KV_KEYS[type]) {
    return new Response("Invalid data type", { status: 400 });
  }

  // 返回异步处理的 Promise
  return (async () => {
    try {
      const data = await getData(type);
      return new Response(JSON.stringify({ type, data }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`[HTTP] Error getting ${type}:`, error);
      return new Response("Internal server error", { status: 500 });
    }
  })();
};

// 启动单一服务器
const port = parseInt(Deno.env.get("PORT") ?? "0") || config.port.http; // 前端待解决
const hostname = config.hostname;

Deno.serve({ port, hostname }, handler);
console.log(`Server running on ${hostname}:${port}`);