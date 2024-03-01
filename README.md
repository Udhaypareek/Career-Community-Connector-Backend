# Backend API Documentation

This README.md file provides documentation for the backend routes of the Career Community Connector project.

## User Routes

### Get All Users
- **URL:** `/api/users/`
- **Method:** GET
- **Protected:** Yes
- **Description:** Fetches all users registered in the system.
- **Middleware:** `protect`

### Register User
- **URL:** `/api/users/`
- **Method:** POST
- **Description:** Registers a new user.
- **Middleware:** None

### User Login
- **URL:** `/api/users/login`
- **Method:** POST
- **Description:** Logs in a registered user.
- **Middleware:** `authUser`

## Message Routes

### Get All Messages in a Chat
- **URL:** `/api/messages/:chatId`
- **Method:** GET
- **Protected:** Yes
- **Description:** Retrieves all messages within a specific chat.
- **Middleware:** `protect`

### Send Message
- **URL:** `/api/messages/`
- **Method:** POST
- **Protected:** Yes
- **Description:** Sends a message in a chat.
- **Middleware:** `protect`

## Chat Routes

### Access Chat
- **URL:** `/api/chats/`
- **Method:** POST
- **Protected:** Yes
- **Description:** Grants access to a chat.
- **Middleware:** `protect`

### Fetch All Chats
- **URL:** `/api/chats/`
- **Method:** GET
- **Protected:** Yes
- **Description:** Retrieves all chats for the authenticated user.
- **Middleware:** `protect`

### Create Group Chat
- **URL:** `/api/chats/group`
- **Method:** POST
- **Protected:** Yes
- **Description:** Creates a group chat.
- **Middleware:** `protect`

### Rename Group Chat
- **URL:** `/api/chats/rename`
- **Method:** PUT
- **Protected:** Yes
- **Description:** Renames a group chat.
- **Middleware:** `protect`

### Remove User from Group Chat
- **URL:** `/api/chats/groupremove`
- **Method:** PUT
- **Protected:** Yes
- **Description:** Removes a user from a group chat.
- **Middleware:** `protect`

### Add User to Group Chat
- **URL:** `/api/chats/groupadd`
- **Method:** PUT
- **Protected:** Yes
- **Description:** Adds a user to a group chat.
- **Middleware:** `protect`

