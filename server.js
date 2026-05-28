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

// Verificar conexión a BD
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
    } else {
        console.log('Connected to database successfully');
        release();
    }
});

// ==================== USUARIOS ====================

// GET - Obtener usuario por ID
app.get('/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    
    try {
        const result = await pool.query('SELECT id, email, password FROM users WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear usuario
app.post('/users', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y password son requeridos' });
    }
    
    try {
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, password',
            [email, password]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

// PUT - Actualizar usuario
app.put('/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { email, password } = req.body;
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    
    if (!email && !password) {
        return res.status(400).json({ error: 'Email o password son requeridos para actualizar' });
    }
    
    try {
        let query;
        let params;
        
        if (email && password) {
            query = 'UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING id, email, password';
            params = [email, password, id];
        } else if (email) {
            query = 'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, password';
            params = [email, id];
        } else {
            query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, email, password';
            params = [password, id];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

// DELETE - Eliminar usuario
app.delete('/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }
    
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ message: 'Usuario eliminado correctamente', id: result.rows[0].id });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0',  () => {
    console.log(`👤 User Service running on http://localhost:${PORT}`);
    console.log(`   Users API: http://localhost:${PORT}/users/:id`);
});