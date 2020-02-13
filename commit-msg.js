const chalk = require('chalk');
const fs = require('fs');
const prompt = require('inquirer').createPromptModule(); 
const execSync = require('child_process').execSync;

const COMMIT_MSG_FILE = `.git/COMMIT_EDITMSG`;
const PATTERN = /^([a-zA-Z]*)(\((.+?)\))?\: (.*)$/;

const msg = fs.readFileSync(COMMIT_MSG_FILE, 'utf-8').trim();
const match = PATTERN.exec(msg);
if(match) {
  try {
    execSync(`git commit -m ${msg}`, { stdio: [0, 1, 2] });
    process.emit('exit', 0);
  } catch(e) {
    process.emit('exit', 1);
  }
}else {
  console.log(chalk.red.inverse('Invalid Commit'));
    process.emit('exit', 1);
}