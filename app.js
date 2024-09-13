require('dotenv').config();
const express = require('express');
// const serverless = require('serverless-http');
const { createClient } = require('@libsql/client');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });


app.get('/home', async (req, res) => {
    // const requestIp = req.ip;
    const requestIp = '12.34.56.78';
    const rs = await turso.execute({
        sql: "SELECT * FROM Messages WHERE ip = ?",
        args: [requestIp],
    });
    console.log(rs);
    res.send(rs);
})

app.post('/create-new-message', async(req, res) => {
    const {name, ip, message} = req.body;
    try {
        await turso.execute({
            sql: "INSERT INTO Messages (name, ip, message, created_at, modified_at) VALUES ($name, $ip, $message, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);",
            args: {
                name: name,
                ip: ip,
                message: message,
            }
        });
        res.status(200).json({message: 'Successfully created new message'});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message});
    }
});

app.patch('/update-message/:id', async(req, res) => {
    const { id } = req.params;
    const {message} = req.body;
    try {
        const result = await turso.execute({
            sql: "UPDATE Messages SET message = $message, modified_at = CURRENT_TIMESTAMP WHERE id = $id",
            args: {
                message: message,
                id: id
            }
        });

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message: 'Successfully updated the message' });
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message});
    }
});

app.delete('/delete-message/:id', async (req, res) => {
    const { id } = req.params; 
    try {
        const result = await turso.execute({
            sql: "DELETE FROM Messages WHERE id = ?",
            args: [id]
        });

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message: 'Message successfully deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: `Failed to delete message due to error: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log('Node app running on port 3000')
})

// module.exports.handler = serverless(app);