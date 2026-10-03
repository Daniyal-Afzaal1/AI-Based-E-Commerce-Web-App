import {app} from "./app.js";
import connectDB from "./db/db.js";

const PORT = process.env.PORT || 3000;

connectDB()
.then(()=> {
    const server = app.listen(PORT, ()=>{
        console.log(`App is listening on PORT ${PORT}`);  
    })

    server.on("error", (err) => {
        console.error("Server Error : ", err);
        process.exit(1);
    })
})
.catch(
    (err) => {
        console.log("DataBase Connection Failed: ", err);
        process.exit(1);
    }
);