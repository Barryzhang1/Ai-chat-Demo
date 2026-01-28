#!/usr/bin/env python3
import re

# 读取文件
with open('sample_data_complete.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 移除 isSpicy, hasScallions, hasCilantro, hasGarlic, cookingTime 字段
# 使用正则表达式匹配并移除这些字段及其对应的值和逗号
patterns = [
    r',?\s*"isSpicy":\s*(true|false)',
    r',?\s*"hasScallions":\s*(true|false)',
    r',?\s*"hasCilantro":\s*(true|false)',
    r',?\s*"hasGarlic":\s*(true|false)',
    r',?\s*"cookingTime":\s*\d+',
]

for pattern in patterns:
    content = re.sub(pattern, '', content)

# 写入文件
with open('sample_data_complete.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("已成功移除所有 isSpicy, hasScallions, hasCilantro, hasGarlic, cookingTime 字段！")
