const inicioDebug = require('debug')('app:inicio')
const dbDebug = require('debug')('app:db')
//Inicializo express
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const config = require('config')

//const logger = require('./logger')
//Modulo Joi
const Joi = require('@hapi/joi')
const app = express()

//middlewares
app.use(express.json())
app.use(cors())

//middleware utilizado para envio de datos por formulario
app.use(express.urlencoded({extended:true}))

//Funcion para archivos estaticos
app.use(express.static('public'))

//Configuracion de entornos
console.log('Aplicacion: ' + config.get('nombre'))
console.log('BD server: ' + config.get('configDB.host'))
//Uso de middleware de tercero - Morgan
if(app.get('env') === 'development'){
    app.use(morgan('tiny'))
    inicioDebug('Morgan habilitado')
}
dbDebug('Conectando con la base de datos')
//middleware propio
//app.use(logger)

//Array de usuarios para mi api
const usuarios = [
    {id:1,nombre:'Grover'},
    {id:2,nombre:'Pablo'},
    {id:3,nombre:'Ana'}
]
//Ruta de inicio
app.get('/', (req, res)=>{
    res.send('Hola Mundo !')
})
//Al entrar a esta ruta se devuelve un array
app.get('/api/usuarios', (req, res)=>{
    res.send(usuarios)
})

app.get('/api/usuarios/:id', (req, res)=>{
    //Busca en el array de usuarios si hay un usuario que coincida con 
    //el id que la persona paso por la url
    let usuario = existeUsuario(req.params.id)
    //En caso que no exista, se enviara un estado 404
    if(!usuario){
        res.status(404).send('El usuario no fue encontrado')
    }else{
        res.send(usuario)
    }
})

app.post('/api/usuarios', (req, res) =>{
    //Validacion del objeto schema
    const {error, value} = validarUsuario(req.body.nombre)
    //Verifica si la validacion es correcta o no
    if(!error){
        const usuario = {
            //Id autoincrementable
            id: usuarios.length + 1,
            nombre: value.nombre
        } 
        //Se añade el usuario al array de usuarios
        usuarios.push(usuario)
        res.send(usuario)       
    }else{
        const mensaje = error.details[0].message
        res.status(400).send(mensaje)
    }
    //Validacion sencilla
    // if(!req.body.nombre || req.body.nombre.length <= 2){
    //     //400 Bad Request
    //     res.status(400).send('Debe ingresar un nombre minimo de 3 letras')
    //     return
    // }
    // const usuario = {
    //     id: usuarios.length + 1,
    //     nombre: req.body.nombre
    // }
    // usuarios.push(usuario)
    // res.send(usuario)
})


app.put('/api/usuarios/:id', (req, res) =>{
    //Encontrar si existe el objeto usuario
    //let usuario = usuarios.find(u=>u.id === parseInt(req.params.id))
    let usuario = existeUsuario(req.params.id)
    if(!usuario){
        res.status(404).send('El usuario no fue encontrado')
        return
    }
    
    //Validacion del objeto schema
    const {error, value} = validarUsuario(req.body.nombre)
    //Verifica si la validacion es correcta o no
    if(error){
        const mensaje = error.details[0].message
        res.status(400).send(mensaje)  
        return
    }
    usuario.nombre = value.nombre
    res.send(usuario)
})

app.delete('/api/usuarios/:id', (req, res) =>{
    let usuario = existeUsuario(req.params.id)
    if(!usuario){
        res.status(404).send('El usuario no fue encontrado')
        return
    }
    const index = usuarios.indexOf(usuario)
    usuarios.splice(index, 1)
    res.send(usuarios)
})

app.get('/api/usuarios/:year/:mes', (req, res)=>{
    res.send(req.query)
})
//Configuracion del puerto donde escuchara el servidor
const port = process.env.PORT || 4000
//Funcion para mostrar en que puerto esta escuchando
app.listen(port, ()=>{
    console.log('Escuchando en el puerto ' + port)
})

function existeUsuario(id){
    return(usuarios.find(u=>u.id === parseInt(id)))
}

function validarUsuario(nom){
    //Validacion con el modulo Joi
    const schema = Joi.object({
        //Valor de tipo string minimo 3 caracteres, requerido
        nombre: Joi.string().min(3).required()
    })
    return (schema.validate({nombre: nom})) //Validacion del schema
}