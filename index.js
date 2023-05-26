const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const session = require('express-session');
var alert = require('alert');



const db = new sqlite3.Database('./node.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        return console.log(err.message);
    }
    console.log('Connected to the node database in test mode.');
})

db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection in test mode.\n');
  });

const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.listen(8080, () => console.log('..Server started at :8080\n'));
app.use(session({secret: "adfdlsdfuhdfkbgkrubuskfu945687kduhgd"}))

function isProductInCart(cart, id){

    for (let i = 0; i < cart.length; i++) {
        if(cart[i].id == id){
           return true;
        }
    }

    return false;
}

function calculateTotal(cart, req){
    total = 0;
    for(let i = 0; i < cart.length; i++){
        if(cart[i].sale_price){
            total = total + (cart[i].sale_price*cart[i].quantity);
        } else {
            total = total + (cart[i].price*cart[i].quantity)
        }
    }
    req.session.total = total;
    return total;
}

app.get('/', function(req, res){

    const con = new sqlite3.Database('./node.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            return console.log(err.message);
        }
        console.log('1. Database connected.');
    });
        con.all('SELECT * FROM products', (err, result) => {
            if(err) throw err;
            res.render('pages/index',{result: result});
            console.log('2. Selection executed.');
        });

    con.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('3. Connection closed.\n');
      });
});

app.post('/', function(req,res){
    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;

    var product = {
        id: id, 
        name: name, 
        price: price, 
        sale_price: sale_price, 
        quantity: quantity, 
        image: image
    };

    if(req.session.cart){

        var cart = req.session.cart;
        if(!isProductInCart(cart,id)){
            cart.push(product);
        }
    } else {

        req.session.cart = [product];
        var cart = req.session.cart;
    }
    calculateTotal(cart,req);

    res.redirect('/cart');
});



app.get('/cart', function(req,res){
 if (!req.session.cart && !req.session.total){
    res.redirect('/');
 } else {
    var cart = req.session.cart;
    var total = req.session.total;
 
    res.render('pages/cart', {cart: cart, total: total});
 }

});

app.post('/cart', function(req,res){

    var id = req.body.id;
    var cart = req.session.cart;

    for (let i = 0; i < cart.length; i++) {
        if(cart[i].id == id) {
            cart.splice(i,1);
        }
    }
    calculateTotal(cart, req);
    res.redirect('/cart');
})

app.post('/quant', function(req,res){


    var id = req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_product_quantity;
    var decrease_btn = req.body.decrease_product_quantity;

    var cart = req.session.cart;

    if(increase_btn){
        for (let i = 0; i < cart.length; i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 0){
                    cart[i].quantity = (Number(cart[i].quantity) + 1);
                }
            }
        }
    }

    if(decrease_btn){
        for (let i = 0; i < cart.length; i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 1){
                    cart[i].quantity = (Number(cart[i].quantity) - 1);
                }
            }
        }
    }

    calculateTotal(cart, req);
    res.redirect('/cart');

});

app.post('/place_order', function(req,res){

    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var address = req.body.adress;
    var cost = req.session.total;
    var status = "not paid";
    var date = (new Date()).toString();
    

    const db = new sqlite3.Database('./orders.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            return console.log(err.message);
        }
        console.log('Connected to the node database');
    });


    db.all("insert into orders (cost, name, email, status, address, phone, date) values (?,?,?,?,?,?,?)", [cost,name,email,status,address,phone,date], (err) => {
        if (err) throw err;
    res.redirect('/payment');
    });


    db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Close the database connection\n');
      });
});

app.get('/payment', function(req,res){
    var total = req.session.total;
    res.render('pages/payment', {total:total})
})

app.get('/contact', function(req,res){
  

    res.render('pages/contact');

});


app.post('/send_message', function(req,res){

    var name = req.body.your_name;
    var email = req.body.your_email;
    var phone = req.body.your_phone;
    var message = req.body.your_message;
    

    const db = new sqlite3.Database('./emails.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            return console.log(err.message);
        }
        console.log('Connected to the node database emails');
    });


    db.all("insert into emails (name,email,phone,message) values (?,?,?,?)", [name,email,phone,message], (err) => {
        if (err) throw err;
    res.redirect('/');
    });

    db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Close the database connection to emails\n');
      });
});


app.post('/send_email', function(req,res){

    var name = req.body.your_name;
    var email = req.body.your_email;
    var phone = req.body.your_phone;
    var message = req.body.your_message;
    

    const db = new sqlite3.Database('./emails.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            return console.log(err.message);
        }
        console.log('Connected to the node database emails');
    });


    db.all("insert into emails (name,email,phone,message) values (?,?,?,?)", [name,email,phone,message], (err) => {
        if (err) throw err;
    res.redirect('/contact');
    });

    db.close((err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Close the database connection to emails\n');
      });
});

app.get('/checkout', function(req,res){
    if (!req.session.total) {
        res.redirect('/');
    } else {
    var total = req.session.total;

    res.render('pages/checkout', {total:total});
    }
});

app.get('/about', function(req,res){

    res.render('pages/about');

});