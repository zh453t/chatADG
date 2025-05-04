## 使用
1. `git clone`
2. 在 `deploy.js` 的目录中创建名为 'data.db' 的空白文件
3. deno run --unstable-kv --allow-read --allow-write --allow-net --allow-env deploy.js

## 数据格式
### KV

| Value                 | Format                      |
| --------------------- | --------------------------- |
| `["message", "<id>"]` | `{id, text, user, time}`    |
| `["rating", "id"]`    | `num[]`              |
| `["reply", "id"]`     | `[{text, user, time}, ...]` |

### GET
| Endpoint | Format |
| --- | --- |
| `/api/messages` | `{type: "messages", data:[{id, text, user, time}, ...]}` |
| `/api/ratings` | `{type: "ratings", data:{<id>: [rating1, ratings2, ...], ...}` |
| `/api/replies` | `{type: "replies", data: {<id>: [{text, user, time, to, id}, ...], ...}` |
| `/api/ratings/:id` | `{ "type": "ratings", "id": "123", "data": [5, 4, 5] }` |
| `/api/replies/:id` | `{ "type": "replies", "id": "123", "data": [{ "id": "...", "text": "...", ... }]` |

### POST
| Endpoint | Format |
| --- | --- |
| /api/messages | `{type: "message", data: {{id, text, user, time}}` |
| /api/ratings | `{type: "rating", data: {id, value}}` |
| /api/replies | `{type: "reply", data: {to, text, user, time}` |

### Websocket Broadcast
 - `{type: "message", data: {id, text, user, time}}`
 - `{type: "rating", data: {id, ratings}}`
 - `{type: "reply", data: {id, replies: [{text, user, time, to, id}, ...]}}`