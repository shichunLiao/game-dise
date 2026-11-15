# Blender connection

Installed Blender 4.5.15 LTS (Apple Silicon) at `/Applications/Blender.app`.
Official DMG SHA256 verified against Blender's published checksum.

MCP for Blender installed in the Blender 4.5 user addons directory and enabled.
Codex global server name: `blender`; starts using the existing absolute uvx path.
Listener: `127.0.0.1:9876`. Remote connections disabled; telemetry disabled.
Restart Codex to load the new MCP tools. Keep Blender open while using them.

Current-chat fallback: `python3 tools/blender/client.py` reads scene information;
`python3 tools/blender/client.py --script path/to/model.py` executes Blender Python.
The connection test successfully read the scene and created, modified and deleted
a temporary mesh, leaving the original object set intact.
Evidence: `artifacts/blender/connection-test.json`.

Connection setup does not mean game character replacement has been completed.
