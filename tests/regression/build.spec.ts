// tests/regression/build.spec.ts
import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Build Validation Tests', () => {
  test('TypeScript compilation succeeds', () => {
    // This test verifies TypeScript can compile without errors
    const result = execSync('npx tsc --noEmit', {
      encoding: 'utf-8',
      cwd: process.cwd()
    });

    // If no error is thrown, compilation succeeded
    expect(true).toBe(true);
  });

  test('Required source files exist', () => {
    const requiredFiles = [
      'src/main.ts',
      'src/config/game.config.ts',
      'src/data/constants.ts',
      'src/scenes/TitleScene.ts',
      'src/scenes/BootScene.ts',
      'src/scenes/TownOutdoorScene.ts',
      'src/scenes/ClinicScene.ts',
      'src/scenes/GardenScene.ts',
      'src/scenes/HomeScene.ts',
      'src/entities/Player.ts',
      'src/systems/SceneManager.ts'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('Configuration files exist', () => {
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts'
    ];

    configFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('Public assets directory structure', () => {
    const assetDirs = [
      'public/assets/maps',
      'public/assets/tiles',
      'public/assets/sprites'
    ];

    assetDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  test('Tileset file exists', () => {
    const tilesetPath = path.join(process.cwd(), 'public/assets/tiles/tileset.json');
    expect(fs.existsSync(tilesetPath)).toBe(true);
  });
});

describe('Package Configuration Tests', () => {
  test('Package.json has required scripts', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
  });

  test('Package.json has required dependencies', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    expect(packageJson.dependencies.phaser).toBeDefined();
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.vite).toBeDefined();
  });

  test('TypeScript configuration is valid', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'tsconfig.json'), 'utf-8')
    );

    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.target).toBe('ES2020');
  });
});