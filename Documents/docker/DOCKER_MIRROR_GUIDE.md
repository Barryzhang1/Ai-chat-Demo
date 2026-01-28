# Docker 镜像加速配置指南

由于网络原因，您在构建 Docker 镜像时遇到了 `DeadlineExceeded` 超时错误（无法拉取 `nginx:alpine`）。
这是因为 Docker Hub 在国内访问不稳定。

请按照以下步骤配置 Docker 镜像加速器。

## macOS Docker Desktop 配置步骤

1. 打开 **Docker Desktop** 应用。
2. 点击右上角的 **齿轮图标 (Settings)**。
3. 选择左侧导航栏的 **Docker Engine**。
4. 在右侧的 JSON 编辑框中，添加或修改 `"registry-mirrors"` 字段。

### 推荐配置

请将以下内容复制并覆盖或合并到您的配置中：

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://huecker.io",
    "https://docker.1panel.live",
    "https://mirror.ccs.tencentyun.com"
  ]
}
```

*(注意：保留您已有的其他配置项，只确保 `registry-mirrors` 数组存在且包含镜像地址)*

5. 点击右下角的 **Apply & restart** 按钮。
6. 等待 Docker 重启完成。

## 验证配置

打开终端，运行以下命令：

```bash
docker info
```

向下滚动，查看 `Registry Mirrors:` 部分，确认上述地址已列出。

## 重新尝试构建

配置完成后，请再次运行您的构建命令：

```bash
docker-compose build
# 或
docker build .
```
