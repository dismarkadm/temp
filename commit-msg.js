const chalk = require('chalk');
const fs = require('fs');
const prompt = require('inquirer').createPromptModule(); 
const execSync = require('child_process').execSync;

const COMMIT_MSG_FILE = `.git/COMMIT_EDITMSG`;
const PATTERN = /^([a-zA-Z]*)(\((.+?)\))?\: (.*)$/;

const STATUS_FAIL = 'failure';
const STATUS_PASS = 'success';

const msg = fs.readFileSync(COMMIT_MSG_FILE, 'utf-8').trim();
const match = PATTERN.exec(msg);
console.log(msg);
console.log(match);


process.argv[2] ?  check(): check();

function check() {
  console.log(process.argv[1]);
  console.log(chalk.greenBright('Inside Checker'));
  if(match !== null) {
    try {
      execSync(`git commit -m ${msg}`, { stdio: [0, 1, 2] });
      // fs.writeFileSync(COMMIT_MSG_FILE, 'dadsad', 'utf8');
      process.emit('exit', STATUS_PASS);
    } catch(e) {
      process.emit('exit', STATUS_FAIL);
    }
  }else {
    console.log(chalk.red.inverse('Invalid Commit'));
    process.emit('exit', STATUS_FAIL);
  }
}