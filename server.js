const express = require('express');
const app = express();
const port = 3000;

// Configuración para usar EJS
app.set('view engine', 'ejs');

// Middleware para parsear el cuerpo de las peticiones POST
app.use(express.urlencoded({ extended: true }));

// Conexión a MySQL
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'b13pnp236lrzukqqyizk-mysql.services.clever-cloud.com',
  user: 'uv7w5dawive9i4rb',
  password: '0eCACeFcf3w8UTT3h77P',
  database: 'b13pnp236lrzukqqyizk'
});

connection.connect(error => {
  if (error) throw error;
  console.log('Conexión exitosa a la base de datos.');
});

// Rutas
app.get('/', (req, res) => {
    res.render('index');
  });
  

  app.get('/cursos', (req, res) => {
    // Ajusta esta consulta según tus necesidades, aquí se seleccionan todos los campos de 'cursos'
    const query = "SELECT * FROM cursos";
    connection.query(query, (error, results) => {
      if (error) throw error;
      // Enviar los resultados a la vista
      res.render('cursos', { cursos: results });
    });
  });
  

  app.get('/centros', (req, res) => {
    const query = "SELECT centros.*, GROUP_CONCAT(cursos.nombre SEPARATOR ', ') AS cursos_ofrecidos FROM centros LEFT JOIN cursos_centros ON centros.id = cursos_centros.centro_id LEFT JOIN cursos ON cursos_centros.curso_id = cursos.id GROUP BY centros.id";
    connection.query(query, (error, results) => {
      if (error) throw error;
      res.render('centros', { centros: results });
    });
  });

  app.get('/alumnos', (req, res) => {
    const query = "SELECT alumnos.*, cursos.nombre AS curso_nombre FROM alumnos LEFT JOIN cursos ON alumnos.curso_id = cursos.id";
    connection.query(query, (error, results) => {
      if (error) throw error;
      res.render('alumnos', { alumnos: results });
    });
  });

  app.post('/alumnos/agregar', (req, res) => {
    const { nombre, dni, nota_media, fecha_nacimiento, curso_id } = req.body;
    const query = "INSERT INTO alumnos (nombre, dni, nota_media, fecha_nacimiento, curso_id) VALUES (?, ?, ?, ?, ?)";
    connection.query(query, [nombre, dni, nota_media, fecha_nacimiento, curso_id], (error, results) => {
      if (error) throw error;
      // Aquí puedes redirigir a una página de confirmación o a la lista de alumnos
      res.redirect('/alumnos');
    });
  });
  

  app.get('/agregar-alumno', (req, res) => {
    // Primero, obtenemos los cursos de la base de datos
    const query = "SELECT * FROM cursos";
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error al obtener los cursos:', error);
        res.send('Ocurrió un error al cargar la página de agregar alumno.');
        return;
      }
      
      // Luego, renderizamos la vista 'agregar-alumno' pasando los cursos obtenidos
      res.render('agregar-alumno', { cursos: results });
    });
  });
  
  app.get('/editar-curso/:id', (req, res) => {
    const { id } = req.params;
    const query = "SELECT * FROM cursos WHERE id = ?";
    connection.query(query, [id], (error, results) => {
      if (error) throw error;
      if (results.length > 0) {
        res.render('editar-curso', { curso: results[0] });
      } else {
        res.send('Curso no encontrado');
      }
    });
  });
  
  app.get('/grafica-cursos', (req, res) => {
    const query = `
      SELECT cursos.id, cursos.nombre, 
             SUM(CASE WHEN alumnos.estado = 'Aprobado' THEN 1 ELSE 0 END) AS aprobados,
             SUM(CASE WHEN alumnos.estado = 'Suspendido' THEN 1 ELSE 0 END) AS suspendidos
      FROM cursos
      LEFT JOIN alumnos ON cursos.id = alumnos.curso_id
      GROUP BY cursos.id;
    `;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error al obtener datos para la gráfica:', error);
        res.send('Ocurrió un error al cargar la página de la gráfica de cursos.');
        return;
      }
      res.render('grafica-cursos', { datos: results });
    });
  });
  
  app.get('/ruta-de-tu-grafica', (req, res) => {
    const query = `
      SELECT c.nombre, AVG(a.nota_media) AS nota_media_promedio
      FROM cursos c
      JOIN alumnos a ON c.id = a.curso_id
      GROUP BY c.id, c.nombre
    `;
  
    connection.query(query, (error, results) => {
      if (error) {
        // Manejar el error adecuadamente
        console.error('Error al obtener datos de cursos y notas medias', error);
        res.send('Ocurrió un error');
        return;
      }
      
      // Enviar los datos a la vista
      res.render('ruta-de-tu-grafica', { datos: results });
    });
});

  
  app.post('/actualizar-curso/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, fecha_importacion, nivel, descripcion, lugar } = req.body;
    const query = "UPDATE cursos SET nombre = ?, fecha_importacion = ?, nivel = ?, descripcion = ?, lugar = ? WHERE id = ?";
    
    connection.query(query, [nombre, fecha_importacion, nivel, descripcion, lugar, id], (error, results) => {
      if (error) throw error;
      // Redirigir al usuario a la lista de cursos o mostrar algún mensaje de éxito
      res.redirect('/cursos');
    });
  });
  

  

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
