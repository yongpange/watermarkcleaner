const { exec } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');

// Function to kill process on port 3000
function killPort3000() {
  return new Promise((resolve, reject) => {
    // For Windows
    if (process.platform === 'win32') {
      exec('netstat -ano | findstr :3000', (err, stdout) => {
        if (err) {
          console.log('No process found on port 3000 or error checking');
          resolve();
          return;
        }

        const lines = stdout.split('\n');
        const pids = [];

        for (const line of lines) {
          const match = line.match(/LISTENING\s+(\d+)/);
          if (match) {
            pids.push(match[1]);
          }
        }

        if (pids.length === 0) {
          console.log('No processes found on port 3000 to kill');
          resolve();
          return;
        }

        let killed = 0;
        pids.forEach(pid => {
          exec(`taskkill /F /PID ${pid}`, (killErr) => {
            if (!killErr) {
              console.log(`Killed process ${pid} on port 3000`);
              killed++;
            }
          });
        });

        setTimeout(() => {
          if (killed > 0) {
            console.log(`Successfully killed ${killed} process(es) on port 3000`);
          }
          resolve();
        }, 1000);
      });
    } else {
      // For Unix-like systems
      exec('lsof -ti:3000', (err, stdout) => {
        if (err || !stdout.trim()) {
          console.log('No process found on port 3000');
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n');
        let killed = 0;

        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, (killErr) => {
            if (!killErr) {
              console.log(`Killed process ${pid} on port 3000`);
              killed++;
            }
          });
        });

        setTimeout(() => {
          if (killed > 0) {
            console.log(`Successfully killed ${killed} process(es) on port 3000`);
          }
          resolve();
        }, 500);
      });
    }
  });
}

// Function to start Next.js server
function startServer() {
  console.log('Starting Next.js development server...');

  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname)
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code || 0);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}

// Main execution
async function main() {
  try {
    console.log('Checking for processes on port 3000...');
    await killPort3000();

    // Wait a moment for ports to be released
    console.log('Waiting for ports to be released...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start the server
    startServer();
  } catch (error) {
    console.error('Error during restart:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Run the script
main();
