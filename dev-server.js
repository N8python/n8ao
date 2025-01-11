import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();

// Enable CORS for all routes
app.use(cors());

// Since __dirname is not defined in ES modules, you have to derive it
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the 'public' directory (update the path as necessary)
app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<body>
    <h1>N8AO</h1>
    <ul>
        <li><a href="/example">Example</a></li>
        <li><a href="/example_postprocessing">Example Postprocessing</a></li>
    </ul>
</body>
`);
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
