# hermes_backend/tools/registry.py
"""Tool registration mechanism for Hermes Backend."""
import logging
from typing import Dict, Any, Callable, Optional, List

logger = logging.getLogger(__name__)

class ToolRegistry:
    """Registry for function-calling tools."""

    def __init__(self):
        self._tools: Dict[str, Dict[str, Any]] = {}

    def register(
        self,
        name: str,
        toolset: str,
        schema: Dict[str, Any],
        handler: Callable[[Dict[str, Any], Any], Dict[str, Any]],
        check_fn: Optional[Callable[[], bool]] = None,
        emoji: str = ""
    ) -> None:
        """Register a tool in the registry.

        Args:
            name: Unique tool identifier.
            toolset: Category/group name for the tool.
            schema: OpenAI-compatible function schema.
            handler: Callable that executes the tool logic.
            check_fn: Optional availability check function.
            emoji: Optional emoji for display purposes.
        """
        self._tools[name] = {
            'name': name,
            'toolset': toolset,
            'schema': schema,
            'handler': handler,
            'check_fn': check_fn,
            'emoji': emoji
        }
        logger.info(f"Registered tool: {name} ({toolset})")

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        """Get tool by name.

        Args:
            name: Tool identifier to lookup.

        Returns:
            Tool configuration dict if found, None otherwise.
        """
        return self._tools.get(name)

    def get_all_tools(self) -> Dict[str, Dict[str, Any]]:
        """Get all registered tools.

        Returns:
            Dictionary of all tool configurations keyed by name.
        """
        return self._tools

    def get_openai_tools(self) -> List[Dict[str, Any]]:
        """Get tools in OpenAI function-calling format.

        Returns:
            List of tools formatted for OpenAI API, each with
            'type': 'function' and 'function': schema structure.
            Only includes tools where check_fn passes or is None.
        """
        return [
            {'type': 'function', 'function': tool['schema']}
            for tool in self._tools.values()
            if tool['check_fn'] is None or tool['check_fn']()
        ]

    def execute_tool(self, name: str, args: Dict[str, Any], **kw) -> Dict[str, Any]:
        """Execute a tool handler.

        Args:
            name: Tool identifier to execute.
            args: Arguments to pass to the tool handler.
            **kw: Additional keyword arguments for the handler.

        Returns:
            Tool execution result, or error dict if tool not found
            or unavailable.
        """
        tool = self.get_tool(name)
        if not tool:
            return {'error': f'Tool not found: {name}'}

        if tool['check_fn'] and not tool['check_fn']():
            return {'error': f'Tool not available: {name}'}

        return tool['handler'](args, **kw)

# Global registry instance
registry = ToolRegistry()