/**
 * 检查缺失文件工具
 * 
 * 此脚本用于扫描项目中可能缺失的导入文件。
 * 使用: node scripts/check-missing-imports.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要检查的扩展名
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// 需要检查的样式文件
const styleExtensions = ['.css', '.less', '.scss', '.sass'];

// 忽略的文件夹
const ignoreDirectories = ['node_modules', 'dist', 'build', '.git'];

// 搜索整个项目中的JavaScript和TypeScript文件
const findAllSourceFiles = async () => {
  const patterns = extensions.map(ext => `**/*${ext}`);
  const files = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: ignoreDirectories.map(dir => `**/${dir}/**`)
    });
    files.push(...matches);
  }
  
  return files;
};

// 从文件中提取导入语句
const extractImports = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  
  // 匹配ES6导入语句
  const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^,\s]+|\w+)\s+from\s+)?['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
};

// 检查导入路径是否存在
const checkIfImportExists = (importPath, sourceFilePath) => {
  const directory = path.dirname(sourceFilePath);
  let fullPath = path.resolve(directory, importPath);
  
  // 如果路径没有扩展名，尝试所有可能的扩展名
  if (!path.extname(fullPath)) {
    for (const ext of [...extensions, ...styleExtensions]) {
      if (fs.existsSync(`${fullPath}${ext}`)) {
        return true;
      }
    }
    
    // 检查index文件
    for (const ext of extensions) {
      if (fs.existsSync(path.join(fullPath, `index${ext}`))) {
        return true;
      }
    }
    
    return false;
  }
  
  return fs.existsSync(fullPath);
};

// 主函数
const checkMissingImports = async () => {
  const sourceFiles = await findAllSourceFiles();
  const missingImports = [];
  
  sourceFiles.forEach(file => {
    const imports = extractImports(file);
    
    imports.forEach(importPath => {
      if (!checkIfImportExists(importPath, file)) {
        missingImports.push({
          file,
          importPath
        });
      }
    });
  });
  
  return missingImports;
};

// 执行检查
const run = async () => {
  try {
    const missing = await checkMissingImports();
    
    // 输出结果
    if (missing.length === 0) {
      console.log('✅ 没有发现缺失的导入文件');
    } else {
      console.log('❌ 发现以下缺失的导入文件:');
      missing.forEach(({ file, importPath }) => {
        console.log(`  ${file} -> ${importPath}`);
      });
    }
  } catch (error) {
    console.error('检查过程中出错:', error);
  }
};

run();
