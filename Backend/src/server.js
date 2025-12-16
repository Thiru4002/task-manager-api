const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

connectDB();

//start server..

const PORT  = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
    console.log("MONGO_URI:", process.env.MONGO_URI);
});
