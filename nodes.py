"""
Node History Manager for ComfyUI
简化版本 - 主要功能在前端JavaScript中实现
"""

class NodeHistoryManager:
    """
    节点历史管理器 - 空节点
    实际功能由前端JavaScript实现
    """
    
    @classmethod
    def INPUT_TYPES(cls):
        """定义输入类型 - 最小化实现"""
        return {
            "required": {},
            "optional": {}
        }
    
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("info",)
    FUNCTION = "get_info"
    CATEGORY = "utils/node_history"
    
    def get_info(self):
        """返回插件信息"""
        return ("AI代码侠土豆 - NodeHistory插件",)