const express = require("express");
const app = express();
const { Pool } = require("pg");
const { generarReporte } = require("./middlewares/generarReporte");
const dotenv = require("dotenv");

const port = process.env.PORT ?? 3000;

app.listen(port, console.log(`Listening on port ${port}`));

const pool = new Pool({
  allowExitOnIdleConnection: true,
  user: "postgres",
  host: "localhost",
  database: "joyas",
  password: process.env.PASSWORD,
  port: 5432,
});
app.get("/joyas", generarReporte, async (req, res) => {
  try {
    const { limits, page, order_by } = req.query;
    let querys = "";
    if (order_by) {
      const [campo, ordenamiento] = order_by.split("_");
      querys += ` ORDER BY ${campo} ${ordenamiento}`;
    }
    if (limits) {
      querys += ` LIMIT ${limits}`;
    }
    if (page && limits) {
      const offset = page * limits - limits;
      querys += ` OFFSET ${offset}`;
    }
    const query = `SELECT * FROM inventario ${querys}`;
    const { rows: joyas } = await pool.query(query);
    const results = joyas.map((joya) => {
      return {
        nombre: joya.nombre,
        href: `/joyas/joya/${joya.id}`
      };
    });
    const totalJoyas= joyas.length;
    const totalStock= joyas.reduce((acumulador, valorActual) => acumulador + valorActual.stock, 0);
    const HATEOAS= {
        results,
        totalJoyas,
        totalStock,
      };
      res.json(HATEOAS);
    }
  catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/joyas/joya/:id", async (req, res) => {
    try {
        const {id}= req.params;
        const query= `SELECT * FROM inventario WHERE id= $1`;
        const values= [id];
        const {rows: joyas}= await pool.query(query, values);
        res.json(joyas)
    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.get("/joyas/filtros", generarReporte, async (req, res) => {
    try {
        const {precio_min, precio_max, metal, categoria}= req.query;
        let filtros= [];
        const values= [];
        const agregarFiltro= (campo, comparador, valor) => {
            values.push(valor);
            const pos= filtros.length + 1;
            filtros.push(`${campo} ${comparador} $${pos}`); 
        }
        if (precio_min) {
            agregarFiltro("precio", ">=", precio_min);
        }
        if (precio_max) {
            agregarFiltro("precio", "<=", precio_max);
        }
        if (metal) {
            agregarFiltro("metal", "=", metal);
        }
        if (categoria) {
            agregarFiltro("categoria", "=", categoria);
        }
        const nuevosFiltros= filtros.join(" AND ");
        filtros= nuevosFiltros? ` WHERE ${nuevosFiltros}` : ""; 
        const query= `SELECT * FROM inventario ${filtros}`;
        

        const {rows: joyas}= await pool.query(query, values);
        res.json(joyas)
    } catch (error) {
        res.status(500).send(error.message);
    }

})

app.get("*", (req, res) => {
    res.status(404).send("Not Found");
})