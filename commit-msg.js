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
  try {
    showMenu();
  } catch(e) {
    process.emit('exit', 1);
  }
}

function showMenu(invalidQuestions = [], preFilledValues = {}) {
  const questions = [
    {
      type: 'list',
      name: 'type',
      message: 'What type of commit is this?',
      choices: [
        'feat:      A new feature',
        'fix:       A bug fix',
        'style:     CSS Changes',
        'cleanup:   Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, dead code removal etc.)',
        'refactor:  A code change that neither fixes a bug nor adds a feature but is used for restructuring the code',
        'perf:      A code change that improves performance',
        'test:      Adding missing tests or fixing them',
        'chore:     Changes to the build process or auxiliary tools and libraries such as documentation generation',
        'tracking:  Any kind of tracking which includes Bug Tracking, User Tracking, Anyalytics, AB-Testing etc',
        'docs:      Documentation only changes'
      ],
      filter(type) {
        return type.substr(0, type.indexOf(':'));
      }
    },
    {
      type: 'input',
      name: 'scope',
      message: 'Enter the scope of the change:',
      validate(scope) {
        return validateMsgScope(scope);
      }
    },
    {
      type: 'input',
      name: 'description',
      message: `Enter the commit description ( Max length ${MAX_LENGTH}):`,
      validate(description) {
        return validateMsgLength(description);
      }
    }
  ];

  let questionsToShow = [];

  // If 'invalidQuestions' are there, then ask only those questions by pulling corresponding questions from above variable. Otherwise ask all!
  if (invalidQuestions.length) {
    invalidQuestions.forEach(questionNum => {
      questionsToShow.push(questions[questionNum - 1]);
    });
  } else {
    questionsToShow = questions;
  }

  return prompt(questionsToShow)
    .then(answers => {
      const msg = `${answers.type || preFilledValues.type}(${answers.scope ||
        preFilledValues.scope}): ${answers.description ||
        preFilledValues.description}`;

      // Need to write back the new commit message to git file.
      fs.writeFileSync(COMMIT_MSG_FILE, msg, 'utf8');
      process.emit('exit', EXIT_TYPES.SUCCESS);
    })
    .catch(err => {
      process.emit('exit', EXIT_TYPES.FAILURE);
    });
}