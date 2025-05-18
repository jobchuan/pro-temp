#!/bin/bash
# 查找缺失的.less文件

echo "正在查找所有导入.less文件但文件不存在的组件..."

# 查找所有导入.less文件的代码
IMPORTS=$(grep -r "import './.*\.less'" src --include="*.jsx" --include="*.js" | awk -F "import " '{print $2}' | awk -F "from " '{print $1}' | tr -d "';")

# 创建一个临时文件来存储结果
TMP_FILE=$(mktemp)

# 检查每个导入
echo "$IMPORTS" | while read -r line; do
  if [ -n "$line" ]; then
    # 提取文件路径
    PATH_PATTERN=$(echo "$line" | sed "s|'\./\(.*\)'|\1|g" | sed "s|'\.\(.*\)'|\1|g")
    
    # 获取导入语句所在的文件
    SOURCE_FILE=$(grep -l "import '$line'" src --include="*.jsx" --include="*.js")
    
    # 检查源文件是否存在
    if [ -n "$SOURCE_FILE" ]; then
      # 获取源文件目录
      SOURCE_DIR=$(dirname "$SOURCE_FILE")
      
      # 构建完整的目标文件路径
      TARGET_FILE="$SOURCE_DIR/$PATH_PATTERN"
      
      # 检查文件是否存在
      if [ ! -f "$TARGET_FILE" ]; then
        echo "缺失文件: $TARGET_FILE (引用于 $SOURCE_FILE)" >> "$TMP_FILE"
      fi
    fi
  fi
done

# 打印结果
if [ -s "$TMP_FILE" ]; then
  echo "发现以下缺失的.less文件:"
  cat "$TMP_FILE"
else
  echo "✅ 没有发现缺失的.less文件"
fi

# 删除临时文件
rm "$TMP_FILE"
