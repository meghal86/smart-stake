#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface FeatureFlags {
  [key: string]: boolean | number;
}

const FLAGS_PATH = path.join(process.cwd(), 'apps/web/src/config/flags.json');

function loadFlags(): FeatureFlags {
  try {
    return JSON.parse(fs.readFileSync(FLAGS_PATH, 'utf-8'));
  } catch (error) {
    return {};
  }
}

function saveFlags(flags: FeatureFlags): void {
  fs.writeFileSync(FLAGS_PATH, JSON.stringify(flags, null, 2));
}

function getFlag(key: string): void {
  const flags = loadFlags();
  console.log(`${key}: ${flags[key] ?? 'undefined'}`);
}

function setFlag(key: string, value: string): void {
  const flags = loadFlags();
  
  // Parse value
  let parsedValue: boolean | number;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (!isNaN(Number(value))) parsedValue = Number(value);
  else throw new Error(`Invalid value: ${value}. Use true/false or number.`);
  
  flags[key] = parsedValue;
  saveFlags(flags);
  console.log(`Set ${key} = ${parsedValue}`);
}

function rampFlag(key: string, percentage: string): void {
  const flags = loadFlags();
  const pct = Number(percentage);
  
  if (isNaN(pct) || pct < 0 || pct > 100) {
    throw new Error('Percentage must be 0-100');
  }
  
  flags[`${key}.ramp`] = pct;
  saveFlags(flags);
  console.log(`Ramped ${key} to ${pct}%`);
}

function listFlags(): void {
  const flags = loadFlags();
  console.log('Current flags:');
  Object.entries(flags).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  
  try {
    switch (command) {
      case 'get':
        if (!args[0]) throw new Error('Usage: flags get <key>');
        getFlag(args[0]);
        break;
        
      case 'set':
        if (!args[0] || !args[1]) throw new Error('Usage: flags set <key> <value>');
        setFlag(args[0], args[1]);
        break;
        
      case 'ramp':
        if (!args[0] || !args[1]) throw new Error('Usage: flags ramp <key> <percentage>');
        rampFlag(args[0], args[1]);
        break;
        
      case 'list':
        listFlags();
        break;
        
      default:
        console.log('Usage: flags <command> [args]');
        console.log('Commands:');
        console.log('  get <key>           Get flag value');
        console.log('  set <key> <value>   Set flag value (true/false/number)');
        console.log('  ramp <key> <pct>    Set ramp percentage (0-100)');
        console.log('  list                List all flags');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { loadFlags, saveFlags, getFlag, setFlag, rampFlag };