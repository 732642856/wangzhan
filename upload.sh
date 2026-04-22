#!/bin/bash

# 星轨网站上传脚本
# 使用方法：将此脚本放到网站文件所在目录，直接运行

FILE_DIR="/Users/wuyongnaren/WorkBuddy/Claw/星轨网站"
REPOOWNER="732642856"
REPOS="wangzhan"
BRANCH="main"
MESSAGE="创建星轨网站 - 初始版本"

echo "正在上传星轨网站到GitHub..."

cd "$FILE_DIR"

for file in index.html style.css script.js; do
    if [ -f "$file" ]; then
        echo "上传 $file..."
        # 读取文件内容并编码
        CONTENT=$(cat "$file" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
        
        # 使用GitHub API上传文件
        curl -s -X PUT "https://api.github.com/repos/$REPOOWNER/$REPOS/contents/$file" \
            -H "Authorization: token YOUR_GH_TOKEN_HERE" \
            -H "Content-Type: application/json" \
            -d "{\"message\":\"$MESSAGE\",\"content\":$CONTENT,\"branch\":\"$BRANCH\"}" || echo "$file 上传失败"
    fi
done

echo "完成！"
echo ""
echo "如果上传失败，可能是token过期。请："
echo "1. 访问 https://github.com/settings/tokens"
echo "2. 生成新token（勾选repo权限）"
echo "3. 告诉我新token，我来帮你上传"