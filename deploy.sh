#!/bin/bash
source ~/.nvm/nvm.sh
nvm use 18.18.2
cd my-app
npx cdk deploy
