[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/Z42oEjTh)


# Express MySQL and Redis API

This repository contains a Node.js application that serves as an API for managing user data and transactions. The application is built using the Express.js framework for handling HTTP requests, MySQL for database interactions, and Redis for caching user data. Below is an overview of the code and its functionalities.

## Deployement
This application is deployed on Render for API services and Railway for mySQL and Redis. For testing the API endpoint, you can access it using the following link: https://w9.api.eswe.dev and use your preferred API testing tool (e.g. Postman, Insomnia, etc.) to send requests.

## Deploying MySQL and Redis on Railway

This application uses MySQL for database interactions and Redis for caching. You can deploy both MySQL and Redis on Railway using the following steps:

### Deploying MySQL

1. Log in to your Railway account and create a new project.
2. Click on the "Add a service" button.
3. Select "MySQL" from the available services.
4. Configure your MySQL service by providing a name and choosing the plan that suits your needs.
5. Once the MySQL service is added, you'll receive the necessary environment variables for connecting to the MySQL database (e.g., `DATABASE_URL`).

### Deploying Redis

1. Log in to your Railway account and go to your project.
2. Click on the "Add a service" button.
3. Select "Redis" from the available services.
4. Configure your Redis service by providing a name and choosing the plan that suits your needs.
5. Once the Redis service is added, you'll receive the necessary environment variables for connecting to the Redis instance (e.g., `REDIS_URL`).

### Configuring Environment Variables

In thia application, i use the environment variables provided by Railway to connect to your MySQL and Redis services with the following configurations:

```javascript
const db = mysql2.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT
});

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});
```

In the process to connect to the database, I use the environment variables provided by Railway and put them in environment configguration on Render.

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

sample request body:
```json
{
    "name": "John Doe",
    "address": "Denpasar"
}
```

### GET /user

Retrieve a list of all users.

### GET /user/:id

Retrieve user details along with their income, expenses, and balance. Data will be cached in Redis for faster retrieval.

sample response:

```json
{
    "name": "John Doe",
    "address": "Denpasar",
    "income": 1000000,
    "expenses": 500000,
    "balance": 500000

}
```


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

## Conclusion

This Express MySQL and Redis API provides a basic but functional example of how to create, read, update, and delete user data and transactions. It incorporates Redis caching for optimized data retrieval. Feel free to modify and extend the code to suit your project's requirements.