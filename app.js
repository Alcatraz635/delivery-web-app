//Module dependencies.
 
var express = require('express');
//var routes = require('./routes');
var http = require('http');
var path = require('path');
var pg = require('pg');
var app = express();
var exphbs = require('express-handlebars');
var favicon = require('serve-favicon');

// all environments
// 
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    helpers: {
        toJSON: function(object) {
            return JSON.stringify(object);
        }
    }
}));
app.set('view engine', 'handlebars');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(favicon('public/images/globe.ico'));
app.use(express.static(path.join(__dirname, 'public')));


// Create Node server
http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

/*
////////////////////////////////////////////////////////////////////////////
-----------------------------MODEL----------------------------------------
////////////////////////////////////////////////////////////////////////////
*/

// Database URL and connection Object
var conString = "postgres://bivfjkey:4As-lAjnRhT8jGXWyuX3KVirl3Hg4ngT@pellefant.db.elephantsql.com:5432/bivfjkey";
var connection = new pg.Client(conString);
// Connect PostgreSQL
connection.connect(function(err) {
    if (err) {
        return console.error('could not connect to postgres', err);
    }
});

// Database setup
connection.query('CREATE TABLE IF NOT EXISTS customer (customer_name text NOT NULL,address character varying(250) NOT NULL,phone_number numeric NOT NULL)');
connection.query("CREATE TABLE IF NOT EXISTS delivery_driver (employee_id integer NOT NULL, employee_name text NOT NULL)");
connection.query("CREATE TABLE IF NOT EXISTS delivery_orders (order_number integer NOT NULL,customer text, delivery_status integer,delivery_address text,deliver_person text)");
connection.query("CREATE TABLE IF NOT EXISTS delivery_status (status_id integer NOT NULL,status text NOT NULL)");
/*
////////////////////////////////////////////////////////////////////////////
-----------------------------CONTROLLER----------------------------------------
////////////////////////////////////////////////////////////////////////////
*/



// Create new customer
app.post("/new-user", function(req, res) {
    var name = req.body.customerName.toString();
    var address = req.body.address.toString();
    var phoneNumber = Number(req.body.phoneNumber);
    connection.query('INSERT INTO customer (customer_name, address, phone_number) VALUES ($1, $2, $3)', [name, address, phoneNumber], function(err, docs) {
        if (err==null) {
          res.render('new',{new_number: phoneNumber});
        }else{
            res.render('new',{customer_error: "error"});
        }
        
    });
});

// Update customer address
app.post("/update-user", function(req, res) {
    console.log(req.body)
    var name = req.body.customerName.toString();
    var address = req.body.address.toString();
    connection.query('UPDATE customer SET address = ($2) WHERE customer_name =  ($1)', [name, address]);
    connection.query('SELECT * FROM customer, delivery_driver WHERE customer_name = ($1)', [name], function(err, docs) {
            res.render('new', {
                customer: docs.rows,
                address_updated:'updated',
            });
        });
});


// Save new delivery
app.post("/new-delivery", function(req, res) {
    var name = req.body.name.toString();
    if (req.body.status.toString() == "Ready for delivery") {
      var status = 1;
    }
    var address = req.body.deliveryAddress.toString();
    var delivery = req.body.deliveryDriver.toString();
    connection.query('INSERT INTO delivery_orders (customer,delivery_status,delivery_address,deliver_person) VALUES ($1, $2, $3, $4) RETURNING order_number', [name, status, address, delivery], function(err, docs) {
        res.render('new',{new_delivery:'Success'});
    });
});



// Customer number lookup
app.post('/lookup', function(req, res) {
    var phoneNumber = Number(req.body.phone_number);
    console.log(phoneNumber);
    if (connection.query('SELECT * FROM customer, delivery_driver WHERE phone_number = ($1)', [phoneNumber]).values[0] == 0) {
        res.render('new', {
                error: 'No results',
            });
    } else {
        connection.query('SELECT * FROM customer, delivery_driver WHERE phone_number = ($1)', [phoneNumber], function(err, docs) {
            res.render('new', {
                customer: docs.rows,
                //customer_found:'found',
            });
        });
    }
});

//Update delivery status
app.post('/update-delivery', function(req, res) {
    console.log(req.body);
    var driver = req.body.driver;
    var deliveries = req.body.id;
    status = Number(req.body.submit)
    if(Array.isArray(deliveries)){
        deliveries.forEach(function(data){
            connection.query('UPDATE delivery_orders SET delivery_status = ($1) WHERE order_number = ($2)',[status, data]);
        })
    }else{ 
        connection.query('UPDATE delivery_orders SET delivery_status = ($1) WHERE order_number = ($2)',[status, deliveries]);
    };
    connection.query('SELECT * FROM delivery_driver;', function(err, docs) {        
        res.render('orders', {
            drivers: docs.rows,
            success:'success'
        });
    });
});


//Return orders specific to deliveryy driver
app.post('/driver-list', function(req,res){
    var driver = req.body.employee;
    connection.query('SELECT * FROM delivery_orders LEFT JOIN delivery_status ON delivery_orders.delivery_status = delivery_status.status_id WHERE delivery_orders.deliver_person =($1) ORDER BY delivery_status, order_number',[driver], function(err, docs) {        
        res.render('orders', {
            orders: docs.rows
        });
    });
})


/*
////////////////////////////////////////////////////////////////////////////
-----------------------------ROUTES----------------------------------------
////////////////////////////////////////////////////////////////////////////
*/


// App root routes
app.get('/', function(req, res) {
        res.render('new')
});


app.get('/lookup', function(req, res) {
    connection.query('SELECT * FROM delivery_driver', function(err, docs) {
        res.render('new', {
            drivers: docs.rows
        });
    });
});

app.get('/new-delivery', function(req, res) {
    connection.query('SELECT * FROM delivery_driver', function(err, docs) {
        res.render('new', {
            drivers: docs.rows
        });
    });
});

app.get('/new-user', function(req, res) {
    connection.query('SELECT * FROM delivery_driver', function(err, docs) {
        res.render('new', {
            drivers: docs.rows
        });
    });
});

app.get('/update-user', function(req, res) {
    connection.query('SELECT * FROM delivery_driver', function(err, docs) {
        res.render('new', {
            drivers: docs.rows
        });
    });
});



//App orders view routes
app.get('/orders', function(req, res) {
    connection.query('SELECT * FROM delivery_driver;', function(err, docs) {        
        res.render('orders', {
            drivers: docs.rows
        });
    });
});

app.get('/update-delivery', function(req, res) {
    connection.query('SELECT * FROM delivery_driver;', function(err, docs) {        
        res.render('orders', {
            drivers: docs.rows
        });
    });
});

app.get('/driver-list', function(req,res){
    connection.query('SELECT * FROM delivery_driver;', function(err, docs) {        
        res.render('orders', {
            drivers: docs.rows
        });
    });
})