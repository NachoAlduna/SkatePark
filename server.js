//Servidor Express. 
const express = require('express');
const app = express();
const pool = require("./configbd.js");
const path = require('path');
const jwt = require('jsonwebtoken');
const expressFileUpload = require("express-fileupload");
const fs = require('fs');
const { registrarSkater, loginSkater, getSkaters, getSkaterById, editarSkater, eliminarSkater, editarEstado } = require('./consultas.js');


//Clave secreta.
const secretKey = 'Powerflip';


//Middleware para manejar la carga de archivos.
app.use(expressFileUpload());
app.listen(3000 , console.log("Servidor funcionando"))

app.use(express.json());


// Configurar Express para servir archivos estáticos desde el directorio 'public'
app.use(express.static('public'));
//Carga los html
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
//Ruta de Registro
app.get("/Registro.html", (req, res) => {
    res.sendFile(path.join(__dirname, "/Registro.html"));
});
//Ruta Login
app.get("/Login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "/Login.html"));
});
//Ruta Daatos
app.get("/Datos.html", (req, res) => {
    res.sendFile(path.join(__dirname, "/Datos.html"));
});
//Ruta para Admin
app.get("/Admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "/Admin.html"));
});



//Ruta para manejar el registro de skaters.
app.post("/registro", async (req, res) => {
    try {
        const mensaje = await registrarSkater(req);
        res.send(mensaje);
    } catch (error) {
        console.error("Error al registrar skater:", error.message);
        res.status(500).send(error.message);
    }
});

//Ruta login y generación de token.
app.get("/login", async (req, res) => {
    try {
        const { email, password } = req.query;

        const { skater, authenticated } = await loginSkater(email, password);

        if (authenticated) {
            //Aquí se genera el token JWT con expiración de 2 minutos y se redirecciona a la ruta /datos.
            const token = jwt.sign({ userId: skater.id }, secretKey, { expiresIn: '2m' });
            res.redirect(`/datos?token=${token}`);
        } else {
            //Redireccina en caso de no funcionar el login.
            res.redirect("/login?error=authentication_failed");
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);
        res.status(401).json({ error: 'Unauthorized', message: error.message });
    }
});

//Obtiene los skaters.
app.get("/skaters", async (req, res) => {
    try {
        const registros = await getSkaters();
        res.json(registros);
    } catch (error) {
        res.status(500).send("Error al obtener los skaters");
    }
});

//Ruta Datos.
app.get('/datos', (req, res) => {
    // Verifica el token y decodifica el token.
    jwt.verify(req.query.token, secretKey, (err, decoded) => {
        if (err) {
            // Control de errores.
        } else {
            req.userId = decoded.userId;
            //Redirecciona a la página de datos.
            res.sendFile(path.join(__dirname, "/Datos.html"));
        }
    });
});


app.get("/skater", async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];        
        //Decodificar el token para obtener el ID de usuario
        const decoded = jwt.verify(token, secretKey);
        const userId = decoded.userId;
        //Consultar los datos del skater usando el ID de usuario
        const skaterData = await getSkaterById(userId);
        if (skaterData.length === 0) {
            throw new Error('Skater no encontrado');
        }
        const skater = skaterData[0];
         res.json(skater);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Ruta para editar datos.
app.put("/editardatos/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const resultado = await editarSkater(id, req);
      res.json(resultado); 
    } catch (error) {
      console.error("Error al editar skater:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
});

//Ruta para borrar datos.
app.delete("/eliminardatos", async (req, res) => {
    try {
        const { id } = req.query; 
        const respuesta = await eliminarSkater(id);
        res.json(respuesta);
    } catch (error) {
        console.error("Error al borrar skater", error);
        res.status(500).json({ error: "Error interno del servidor al eliminar skater" });
    }
});

// Ruta para actualizar el estado adicional del skater
app.put("/actualizarEstado/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { estadoAdicional } = req.body;
       await editarEstado(id, estadoAdicional);
        res.status(200).send("Skater actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar Skater", error.message);
        res.status(500).send("Error al actualizar Skater");
    }
});