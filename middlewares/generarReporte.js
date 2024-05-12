const generarReporte= (req,res, next)=>{
    const url= req.url;
    const querys= req.query;
    console.log(`Se ha recibido una petición a ${url}, con los siguientes parámetros: ${JSON.stringify(querys)}`);
    next();

}

module.exports= {generarReporte};