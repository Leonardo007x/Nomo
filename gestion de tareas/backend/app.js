const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Utilizamos las variables de entorno para concordar con la exploración técnica
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://database:27017/taskapp';

// Configuración de CORS para aceptar peticiones desde el frontend
app.use(cors());
app.use(express.json());

// Conexión a MongoDB usando la variable de entorno

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado a MongoDB exitosamente.'))
    .catch(err => console.error('Error al conectarse a MongoDB:', err));

// Endpoint GET /
app.get('/', (req, res) => {
    res.send('API funcionando');
});

// Endpoint GET /tasks
app.get('/tasks', (req, res) => {
    // Tareas de ejemplo solicitadas
    const tareasEjemplo = [
        { id: 1, title: 'Configurar Docker Compose', completed: true },
        { id: 2, title: 'Desarrollar Frontend y Backend', completed: true },
        { id: 3, title: 'Aprobar la práctica de Sistemas Distribuidos', completed: false }
    ];
    res.json(tareasEjemplo);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
});
