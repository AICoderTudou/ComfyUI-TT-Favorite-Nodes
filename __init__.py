"""
ComfyUI Node History Plugin
A plugin to manage and quickly access frequently used nodes
"""

from .nodes import NodeHistoryManager

# 节点类映射
NODE_CLASS_MAPPINGS = {
    "NodeHistoryManager": NodeHistoryManager,
}

# 节点显示名称映射
NODE_DISPLAY_NAME_MAPPINGS = {
    "NodeHistoryManager": "常用节点历史管理器",
}

# Web目录，用于前端JavaScript文件
WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']