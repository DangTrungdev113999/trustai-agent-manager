import app from './app.js';

const PORT = process.env.PORT || 3015;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
