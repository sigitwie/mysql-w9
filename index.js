const express = require('express');
const mysql2 = require('mysql2');
const bodyParser = require('body-parser');
const Redis = require('ioredis');



const app = express();
require('dotenv').config();

const db = mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});


db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ', err);
    } else {
        console.log('Connected to the database!');
    }
});

redisClient.on('connect', () => {
    console.log('Connected to Redis!');
});


app.use(bodyParser.json());

const commonResponse = (data, message, success = true, error = null) => {
    if (success) {
        return {
            success: true,
            message: message,
            data: data
        };
    } else {
        return {
            success: false,
            error: error,
            message: message
        };
    }
};

app.post('/user', (req, res) => {
    const { name, address } = req.body;
    db.query(
        'INSERT INTO User (name, address) VALUES (?, ?)',
        [name, address],
        (err, result) => {
            if (err) {
                console.error('Failed to add user data', err);
                res.status(500).json(commonResponse(null, 'Failed to add user data', false, err));
            } else {
                const userId = result.insertId;
                res.json(commonResponse({ userId }, 'User added successfully!', true));
            }
        }
    );
});


app.get('/user', (req, res) => {
    db.query(
        'SELECT * FROM User',
        (err, result) => {
            if (err) {
                console.error('Failed to fetch user data', err);
                res.status(500).json(commonResponse(null, 'Failed to fetch user data', false, err));
            } else {
                res.json(commonResponse(result, 'User data fetched successfully!', true));
            }
        }
    );
});

app.get('/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if user data exists in Redis cache
        const cachedUserData = await redisClient.get(`user:${id}`);

        if (cachedUserData) {
            // If cached data exists, return it
            const userData = JSON.parse(cachedUserData);
            console.log('Retrieved data from Redis cache:', userData);
            res.json(userData);
        } else {
            // If cached data doesn't exist, fetch from MySQL and cache it
            db.query(
                'SELECT User.*, ' +
                '   SUM(CASE WHEN Transaction.type = "income" THEN Transaction.amount ELSE 0 END) AS income, ' +
                '   SUM(CASE WHEN Transaction.type = "expense" THEN Transaction.amount ELSE 0 END) AS expense, ' +
                '   COALESCE (SUM(CASE WHEN Transaction.type = "income" THEN Transaction.amount ELSE -Transaction.amount END), 0) AS balance ' +
                'FROM User ' +
                'LEFT JOIN Transaction ON User.id = Transaction.user_id ' +
                'WHERE User.id = ? ' +
                'GROUP BY User.id',
                [id],
                async (err, result) => {
                    if (err) {
                        console.error('Failed to fetch user data', err);
                        res.status(500).json({ error: 'Failed to fetch user data' });
                    } else {
                        if (result.length === 0) {
                            res.status(404).json({ error: 'User not found' });
                        } else {
                            const userData = result[0];
                            // Cache user data in Redis with a TTL
                            await redisClient.setex(`user:${id}`, 25, JSON.stringify(userData));
                            console.log('Cached data in Redis:', userData);
                            res.json(userData);
                        }
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.put('/user/:id', (req, res) => {
    const { id } = req.params;
    const { name, address } = req.body;
    db.query(
        'UPDATE User SET name = ?, address = ? WHERE id = ?',
        [name, address, id],
        (err, result) => {
            if (err) {
                console.error('Failed to update user data', err);
                res.status(500).json(commonResponse(null, 'Failed to update user data', false, err));
            } else {
                if (result.affectedRows === 0) {
                    res.status(404).json(commonResponse(null, 'User not found', false));
                } else {
                    res.json(commonResponse({ userId: id }, 'User updated successfully!', true));
                }
            }
        }
    );
});


app.delete('/user/:id', (req, res) => {
    const { id } = req.params;
    db.query(
        'DELETE FROM User WHERE id = ?',
        [id],
        (err, result) => {
            if (err) {
                console.error('Failed to delete user data', err);
                res.status(500).json(commonResponse(null, 'Failed to delete user data', false, err));
            } else {
                if (result.affectedRows === 0) {
                    res.status(404).json(commonResponse(null, 'User not found', false));
                } else {
                    res.json(commonResponse({ userId: id }, 'User deleted successfully!', true));
                }
            }
        }
    );
});


app.post('/transaction', (req, res) => {
    const { type, amount, user_id } = req.body;

    if (type !== "income" && type !== "expense") {
        return res.status(400).json(commonResponse(null, 'Invalid transaction type', false, 'Invalid transaction type'));
    }

    db.query(
        'SELECT id FROM User WHERE id = ?',
        [user_id],
        (userErr, userResult) => {
            if (userErr) {
                console.error('Failed to fetch user data', userErr);
                return res.status(500).json(commonResponse(null, 'Failed to fetch user data', false, userErr));
            }

            if (userResult.length === 0) {
                return res.status(400).json(commonResponse(null, 'Invalid user_id', false, 'Invalid user_id'));
            }

            db.query(
                'INSERT INTO Transaction (user_id, type, amount) VALUES (?, ?, ?)',
                [user_id, type, amount],
                async (err, result) => {
                    if (err) {
                        console.error('Failed to add transaction data', err);
                        res.status(500).json(commonResponse(null, 'Failed to add transaction data', false, err));
                    } else {
                        const insertedId = result.insertId; // Get the ID of the inserted transaction

                        // Clear the cached user data
                        await redisClient.del(`user:${user_id}`);

                        res.json(commonResponse({ id: insertedId }, 'Transaction added successfully!', true));
                    }
                }
            );

        }
    );
});




app.get('/transaction', (req, res) => {
    db.query(
        'SELECT * FROM Transaction',
        (err, result) => {
            if (err) {
                console.error('Failed to fetch transaction data', err);
            } else {
                res.json(result);
            }
        }
    );
});


app.get('/transaction/:id', (req, res) => {
    const { id } = req.params;
    db.query(
        'SELECT * FROM Transaction WHERE id = ?',
        [id],
        (err, result) => {
            if (err) {
                console.error('Failed to fetch transaction data', err);
                res.status(500).json(commonResponse(null, 'Failed to fetch transaction data', false, err));
            } else {
                if (result && result.length > 0) {
                    const transactionData = result[0];
                    res.json(commonResponse(transactionData, 'Transaction data fetched successfully!', true));
                } else {
                    res.status(404).json(commonResponse(null, 'Transaction not found', false, 'Transaction not found'));
                }
            }
        }
    );
});


app.put('/transaction/:id', async (req, res) => {
    const { id } = req.params;
    const { type, amount, user_id } = req.body;

    if (type !== "income" && type !== "expense") {
        return res.status(400).json(commonResponse(null, 'Invalid transaction type', false, 'Invalid transaction type'));
    }

    try {
        db.query(
            'SELECT id FROM User WHERE id = ?',
            [user_id],
            async (userErr, userResult) => {
                if (userErr) {
                    console.error('Failed to fetch user data', userErr);
                    return res.status(500).json(commonResponse(null, 'Failed to fetch user data', false, userErr));
                }

                if (userResult.length === 0) {
                    return res.status(400).json(commonResponse(null, 'Invalid user_id', false, 'Invalid user_id'));
                }

                db.query(
                    'UPDATE Transaction SET type = ?, amount = ?, user_id = ? WHERE id = ?',
                    [type, amount, user_id, id],
                    async (err, result) => {
                        if (err) {
                            console.error('Failed to update transaction data', err);
                            res.status(500).json(commonResponse(null, 'Failed to update transaction data', false, err));
                        } else {
                            // Clear the cached user data
                            await redisClient.del(`user:${user_id}`);

                            const updatedId = id; // Use the same ID that was updated
                            res.json(commonResponse({ id: updatedId }, 'Transaction updated successfully!', true));
                        }
                    }
                );

            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.delete('/transaction/:id', async (req, res) => {
    const { id } = req.params;

    // Check if the transaction ID exists
    db.query(
        'SELECT id FROM Transaction WHERE id = ?',
        [id],
        async (err, result) => {
            if (err) {
                console.error('Failed to check transaction data', err);
                res.status(500).json(commonResponse(null, 'Failed to check transaction data', false, err));
            } else {
                if (result.length === 0) {
                    res.status(404).json(commonResponse(null, 'Transaction not found', false, 'Transaction not found'));
                } else {
                    // Delete the transaction
                    db.query(
                        'DELETE FROM Transaction WHERE id = ?',
                        [id],
                        async (deleteErr, deleteResult) => {
                            if (deleteErr) {
                                console.error('Failed to delete transaction data', deleteErr);
                                res.status(500).json(commonResponse(null, 'Failed to delete transaction data', false, deleteErr));
                            } else {
                                // Clear the cached user data
                                await redisClient.del(`user:${id}`);

                                res.json(commonResponse({ id }, 'Transaction deleted successfully!', true));
                            }
                        }
                    );
                }
            }
        }
    );
});







app.listen(3000, () => {
    console.log('Server is running on port 3000');
});