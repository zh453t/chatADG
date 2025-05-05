## 使用
0. *安装 `git` `deno`*
1. `git clone https://github.com/zh453t/chatADG`
2. 在任意目录中创建一个后缀名为 `.db` 的空白文件
3. 修改 `deploy.js` 第 4 行为：`Deno.openKv('<db_file_path>')`
3. 执行 `deno run --unstable-kv --allow-read --allow-write --allow-net --allow-env deploy.js`

## 数据格式与要求
| Type | Format |
| --- | --- |
| `Message` | `{ text: string, user: string, time: number, id: string }` |
| `Rating` | `{ id: string, value: number }` |
| `Reply` | `{ text: string, user: string, time: number, to: string, id: string }` |

### Deno.KV

| Key | Format |
| --- | --- |
| `["message", "<id>"]` | `Message` |
| `["rating", "id"]` | `number[]` |
| `["reply", "id"]` | `Reply[]` |

### GET
| Endpoint | Format |
| --- | --- |
| `/api/messages` | `{ type: "messages", data: Message[] }` |
| `/api/ratings` | `{ type: "ratings", data: { <id>: number[], ... } }` |
| `/api/replies` | `{ type: "replies", data: { <id>: Reply[], ... }` |
| `/api/ratings/:id` | `{ type: "ratings", id: string, data: number[] }` |
| `/api/replies/:id` | `{ type: "replies", id: string, data: Reply[] }` |

### POST
| Endpoint | Format |
| --- | --- |
| `/api/messages` | `{ type: "message", data: Message }` |
| `/api/ratings` | `{ type: "rating", data: Rating }` |
| `/api/replies` | `{ type: "reply", data: Reply }` |

### Websocket Broadcast
| Type | Format |
| --- | --- |
| `Message` | `{ type: "message", data: Message }` |
| `Rating` | `{ type: "rating", data: { id: string, ratings: number[] } }` |
| `Reply` | `{ type: "reply", data: { id: string, replies: Reply[] } }` |