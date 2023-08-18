[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/Z42oEjTh)


# Express MySQL and Redis API

This repository contains a Node.js application that serves as an API for managing user data and transactions. The application is built using the Express.js framework for handling HTTP requests, MySQL for database interactions, and Redis for caching user data. Below is an overview of the code and its functionalities.

## Prerequisites

Before you start using this code, make sure you have the following installed:

- Node.js
- MySQL server
- Redis server

## Setup

1. Clone this repository to your local machine.
2. Install the required dependencies using the following command:

```bash
npm install
```

3. Configure your MySQL database connection by updating the `db` object in the code with your database credentials.

```javascript
const db = mysql2.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'FinApp'
});
```

4. Start your Redis server and ensure it's running on the default port (`6379`).
5. Run the application using the following command:

```bash
node app.js
```

The server will start and listen on port `3000`.

## API Endpoints

### POST /user

Create a new user.

### GET /user

Retrieve a list of all users.

### GET /user/:id

Retrieve user details along with their income, expenses, and balance. Data will be cached in Redis for faster retrieval.

### PUT /user/:id

Update user details.

### DELETE /user/:id

Delete a user and their cached data from Redis.

### POST /transaction

Add a new transaction. Clears the cached user data in Redis.

### GET /transaction

Retrieve a list of all transactions.

### GET /transaction/:id

Retrieve details of a specific transaction.

### PUT /transaction/:id

Update details of a specific transaction. Clears the cached user data in Redis.

### DELETE /transaction/:id

Delete a specific transaction and clear the cached user data in Redis.

## Response Format

The API responses follow a common format for consistency:

```json
{
    "success": true,
    "message": "Response message",
    "data": {...},   // Varies based on the endpoint
    "error": null    // Present only if success is false
}
```

## Caching Strategy

User data is cached in Redis for faster retrieval. When a user's data is retrieved, it's first checked in the Redis cache. If it's present, the cached data is returned. If not, the data is fetched from the MySQL database, cached in Redis, and then returned.

## Error Handling

Errors are handled gracefully, and appropriate error messages are returned along with HTTP status codes.

## Conclusion

This Express MySQL and Redis API provides a basic but functional example of how to create, read, update, and delete user data and transactions. It incorporates Redis caching for optimized data retrieval. Feel free to modify and extend the code to suit your project's requirements.