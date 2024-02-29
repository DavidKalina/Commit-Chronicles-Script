#!/usr/bin/env node
// scripts/commitScript.ts
import axios from "axios";
import { spawn } from "child_process";
import dotenv from "dotenv";
dotenv.config();

interface CommitData {
  hash: string;
  message: string;
  author: string;
  changes: string;
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let data = "";
    proc.stdout.on("data", (chunk) => (data += chunk));
    proc.stderr.on("data", (chunk) => console.error(chunk.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve(data.trim());
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function getCommitData() {
  const hash = await runCommand("git", ["rev-parse", "HEAD"]);
  const message = await runCommand("git", ["log", "-1", "--pretty=%B"]);
  const author = await runCommand("git", ["log", "-1", "--pretty=%an"]);
  const changes = await runCommand("git", ["show", "--pretty=format:", "HEAD"]);
  return { hash, message, author, changes };
}

async function sendToServer(commitData: CommitData) {
  try {
    await axios.post(`${process.env.API_URL}/generateEntry`, commitData);
  } catch (error: any) {
    console.log(error);
    console.error("Failed to create entry:", error.response.data);
  }
}

async function main() {
  try {
    const commitData = await getCommitData();
    await sendToServer(commitData);
  } catch (error) {
    console.error("Error fetching commit data:", error);
  }
}

main();
