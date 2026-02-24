import { exec } from 'child_process';

export async function pingInternet(target: string = 'google.com'): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`ping ${target}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(`Ping failed: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

export async function pingDevice(target: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`ping ${target}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(`Ping failed: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}
