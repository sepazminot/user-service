import express from 'express';
import pg from 'pg';
import cors from 'cors';

process.env.NODE_ENV === 'production' && console.log('⚠️  Running in production mode');

const { Pool } = pg;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    max: 20,              // máximo conexiones simultáneas
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 5000,
});

// ==================== USUARIOS ====================\

// GET - Obtener usuario
app.get('/users/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, password FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// POST - Crear usuario
app.post('/users', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, password',
            [email, password]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// PUT - Actualizar usuario (Lógica simplificada: siempre van ambos campos)
app.put('/users/:id', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING id, email, password',
            [email, password, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// DELETE - Eliminar usuario
app.delete('/users/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0',  () => {
    console.log(`👤 User Service running on http://localhost:${PORT}`);
    console.log(`   Users API: http://localhost:${PORT}/users/:id`);
});