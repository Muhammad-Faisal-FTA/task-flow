```

---

**Bruno test collection for this route:**
```
── GET /api/tasks
Headers:
  Authorization: Bearer <accessToken>

Query params (all optional):
  ?grouped=true
  ?listId=<mongoId>
  ?search=groceries
  ?includeCompleted=false

Expected: 200
{
  "data": {
    "overdue":   [...],
    "today":     [...],
    "tomorrow":  [...],
    "next_week": [...],
    "future":    [...],
    "nodate":    [...]
  }
}

── POST /api/tasks
Headers:
  Authorization: Bearer <accessToken>
  Content-Type: application/json

Body:
{
  "title":   "Buy groceries",
  "listId":  "<mongoId>",
  "dueDate": "2026-04-01",
  "dueTime": "09:00",
  "repeat":  "none"
}

Expected: 201
{
  "data": {
    "id":        "...",
    "title":     "Buy groceries",
    "status":    "today",
    "completed": false,
    ...
  }
}

── Validation errors — 422:
{
  "error": "Validation failed.",
  "fields": {
    "title":  ["Title is required"],
    "listId": ["Invalid listId format"]
  }
}





```

---

**Bruno test collection for this route:**
```
── GET /api/tasks/:taskId
Headers:
  Authorization: Bearer <accessToken>

Expected 200:
{ "data": { "id": "...", "title": "...", "status": "today", ... } }

Expected 404:
{ "error": "Task not found." }

── PATCH /api/tasks/:taskId — standard update
Headers:
  Authorization: Bearer <accessToken>
  Content-Type: application/json
Body:
{
  "title":   "Updated title",
  "dueDate": "2026-04-05",
  "dueTime": "14:00",
  "repeat":  "weekly"
}
Expected 200: { "data": { ...updatedTask } }

── PATCH /api/tasks/:taskId — toggle complete (FR-04)
Body: { "toggle": true }
Expected 200: { "data": { "completed": true, "completedAt": "..." } }

── PATCH /api/tasks/:taskId — restore deleted task (FR-15)
Body: { "restore": true }
Expected 200: { "data": { "deletedAt": null, ... } }

── PATCH /api/tasks/:taskId — move to different list
Body: { "listId": "<newListId>" }
Expected 200: { "data": { "listId": "<newListId>", ... } }

── PATCH /api/tasks/:taskId — clear due date
Body: { "dueDate": null }
Expected 200: { "data": { "dueDate": null, "status": "nodate", ... } }

── DELETE /api/tasks/:taskId — soft delete (FR-15)
Headers:
  Authorization: Bearer <accessToken>

Expected 200:
{
  "data": { "deletedAt": "2026-03-31T...", ... },
  "message": "Task deleted. You can undo this action."
}

── DELETE /api/tasks/:taskId?permanent=true — hard delete
Expected 200: { "message": "Task permanently deleted." }

── Invalid ObjectId
GET /api/tasks/not-a-valid-id
Expected 400: { "error": "Invalid taskId: must be a valid ID." }



```

---

**Bruno test collection for this route:**
```
── GET /api/lists
Headers:
  Authorization: Bearer <accessToken>

Expected 200:
{
  "data": [
    {
      "id":           "...",
      "name":         "Default",
      "color":        "#1E8BC3",
      "isDefault":    true,
      "taskCount":    4,
      "overdueCount": 2,
      "createdAt":    "...",
      "updatedAt":    "..."
    },
    {
      "id":           "...",
      "name":         "Work",
      "color":        "#E53935",
      "isDefault":    false,
      "taskCount":    3,
      "overdueCount": 1,
      ...
    }
  ]
}

── POST /api/lists
Headers:
  Authorization: Bearer <accessToken>
  Content-Type: application/json

Body:
{
  "name":  "Shopping",
  "color": "#43A047"
}

Expected 201:
{
  "data": {
    "id":           "...",
    "name":         "Shopping",
    "color":        "#43A047",
    "isDefault":    false,
    "taskCount":    0,
    "overdueCount": 0,
    ...
  }
}

── POST /api/lists — duplicate name
Body: { "name": "Default", "color": "#1E8BC3" }
Expected 409:
{ "error": "A list with this name already exists." }

── POST /api/lists — invalid color
Body: { "name": "Work", "color": "blue" }
Expected 422:
{
  "error": "Validation failed.",
  "fields": {
    "color": ["Color must be a valid hex color e.g. #1E8BC3"]
  }
}

── POST /api/lists — missing name
Body: { "color": "#1E8BC3" }
Expected 422:
{
  "error": "Validation failed.",
  "fields": {
    "name": ["List name is required"]
  }
}

── POST /api/lists — unknown field rejected
Body: { "name": "Work", "color": "#E53935", "isDefault": true }
Expected 422:
{
  "error": "Validation failed.",
  "fields": { "isDefault": ["Unrecognized key(s) in object: 'isDefault'"] }
}



```

---

**Bruno test collection for this route:**
```
── GET /api/lists/:listId
Headers:
  Authorization: Bearer <accessToken>

Expected 200:
{
  "data": {
    "id":           "...",
    "name":         "Work",
    "color":        "#E53935",
    "isDefault":    false,
    "taskCount":    3,
    "overdueCount": 1,
    "createdAt":    "...",
    "updatedAt":    "..."
  }
}

Expected 404:
{ "error": "List not found." }

── PATCH /api/lists/:listId — rename
Headers:
  Authorization: Bearer <accessToken>
  Content-Type: application/json

Body: { "name": "Personal" }
Expected 200:
{
  "data": {
    "id":    "...",
    "name":  "Personal",
    "color": "#E53935",
    ...
  }
}

── PATCH /api/lists/:listId — recolor
Body: { "color": "#43A047" }
Expected 200:
{
  "data": {
    "name":  "Work",
    "color": "#43A047",
    ...
  }
}

── PATCH /api/lists/:listId — rename + recolor
Body: { "name": "Personal", "color": "#7B1FA2" }
Expected 200: { "data": { "name": "Personal", "color": "#7B1FA2", ... } }

── PATCH /api/lists/:listId — empty body rejected
Body: {}
Expected 422:
{
  "error": "Validation failed.",
  "fields": {
    "_errors": ["At least one field (name or color) must be provided."]
  }
}

── PATCH /api/lists/:listId — duplicate name
Body: { "name": "Default" }
Expected 409:
{ "error": "A list with this name already exists." }

── PATCH /api/lists/:listId — invalid color
Body: { "color": "red" }
Expected 422:
{
  "error": "Validation failed.",
  "fields": {
    "color": ["Color must be a valid hex color e.g. #1E8BC3"]
  }
}

── DELETE /api/lists/:listId — success
Headers:
  Authorization: Bearer <accessToken>

Expected 200:
{ "message": "List deleted successfully." }

── DELETE /api/lists/:listId — default list
Expected 400:
{ "error": "Cannot delete the default list." }

── DELETE /api/lists/:listId — list has tasks
Expected 400:
{ "error": "Cannot delete a list that contains tasks. Move or delete tasks first." }

── DELETE /api/lists/:listId — not found
Expected 404:
{ "error": "List not found." }

── Invalid ObjectId
PATCH /api/lists/not-valid-id
Expected 400:
{ "error": "Invalid listId: must be a valid ID." }