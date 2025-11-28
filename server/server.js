import app from './app.js';
import dotenv from "dotenv";
dotenv.config();

const port = 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

// Start simulation if enabled via env
if (process.env.SIMULATION === 'true') {
  // dynamic import to avoid startup errors when simulation file not present
  import('./simulation.js').then(mod => {
    mod.default({}); // startSimulation
  }).catch(err => {
    console.error('Failed to start simulation:', err);
  });
}
