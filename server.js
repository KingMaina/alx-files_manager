import express from 'express';
import routes from './routes';

const PORT = process.env.PORT ? process.env.PORT : 5000;
const app = express();

app.use('/', routes);

app.listen(PORT);
